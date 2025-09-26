"""
Background sync jobs for Alibaba integration.
"""

import uuid
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import (
    IntegrationCredential, AlibabaOrder, AlibabaShipment, AlibabaSupplier,
    SyncLog, ProviderEnum, SyncKindEnum, SyncStatusEnum
)
from lib.alibaba_client import get_client_for_user
from crypto import decrypt_data

logger = logging.getLogger(__name__)


def create_sync_log(db: Session, user_id: str, kind: SyncKindEnum) -> SyncLog:
    """Create sync log entry."""
    user_uuid = uuid.UUID(user_id)
    sync_log = SyncLog(
        user_id=user_uuid,
        provider=ProviderEnum.ALIBABA,
        kind=kind,
        status=SyncStatusEnum.RUNNING,
        started_at=datetime.utcnow()
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)
    return sync_log


def alibaba_sync_full(user_id: str):
    """Full sync of all Alibaba data."""
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        sync_log = create_sync_log(db, user_id, SyncKindEnum.FULL)
        
        # Sync orders, shipments, and suppliers
        orders_count = alibaba_sync_orders(user_id, full=True)
        shipments_count = alibaba_sync_shipments(user_id)
        suppliers_count = alibaba_sync_suppliers(user_id)
        
        # Update sync log
        sync_log.status = SyncStatusEnum.COMPLETED
        sync_log.finished_at = datetime.utcnow()
        sync_log.stats = {
            "orders_synced": orders_count,
            "shipments_synced": shipments_count,
            "suppliers_synced": suppliers_count
        }
        db.commit()
        
        logger.info(f"Full sync completed for user {user_id}: {orders_count} orders, {shipments_count} shipments, {suppliers_count} suppliers")
        
    except Exception as e:
        logger.error(f"Full sync failed for user {user_id}: {str(e)}")
        if 'sync_log' in locals():
            sync_log.status = SyncStatusEnum.FAILED
            sync_log.finished_at = datetime.utcnow()
            sync_log.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


def alibaba_sync_orders(user_id: str, full: bool = False):
    """Sync Alibaba orders."""
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        sync_log = create_sync_log(db, user_id, SyncKindEnum.ORDERS)
        client = get_client_for_user(db, uuid.UUID(user_id))
        user_uuid = uuid.UUID(user_id)
        
        # Get last successful sync time if not full sync
        updated_after = None
        if not full:
            last_sync = db.query(SyncLog).filter(
                and_(
                    SyncLog.user_id == user_uuid,
                    SyncLog.provider == ProviderEnum.ALIBABA,
                    SyncLog.kind == SyncKindEnum.ORDERS,
                    SyncLog.status == SyncStatusEnum.COMPLETED
                )
            ).order_by(SyncLog.finished_at.desc()).first()
            
            if last_sync:
                updated_after = last_sync.finished_at
        
        # Fetch orders from Alibaba
        orders, next_token = client.list_orders(updated_after=updated_after)
        orders_count = 0
        
        # Process orders
        for order_data in orders:
            # Upsert order
            existing_order = db.query(AlibabaOrder).filter(
                and_(
                    AlibabaOrder.user_id == user_uuid,
                    AlibabaOrder.alibaba_order_id == order_data["id"]
                )
            ).first()
            
            if existing_order:
                # Update existing order
                existing_order.status = order_data.get("status", "unknown")
                existing_order.buyer_company = order_data.get("buyer_company", "")
                existing_order.supplier_company = order_data.get("supplier_company", "")
                existing_order.currency = order_data.get("currency", "USD")
                existing_order.total_amount = float(order_data.get("total_amount", 0))
                existing_order.updated_at = datetime.utcnow()
                existing_order.raw = order_data
            else:
                # Create new order
                new_order = AlibabaOrder(
                    user_id=user_uuid,
                    alibaba_order_id=order_data["id"],
                    status=order_data.get("status", "unknown"),
                    buyer_company=order_data.get("buyer_company", ""),
                    supplier_company=order_data.get("supplier_company", ""),
                    currency=order_data.get("currency", "USD"),
                    total_amount=float(order_data.get("total_amount", 0)),
                    created_at=datetime.fromisoformat(order_data.get("created_at", datetime.utcnow().isoformat())),
                    updated_at=datetime.utcnow(),
                    raw=order_data
                )
                db.add(new_order)
            
            orders_count += 1
        
        db.commit()
        
        # Update sync log
        sync_log.status = SyncStatusEnum.COMPLETED
        sync_log.finished_at = datetime.utcnow()
        sync_log.stats = {"orders_synced": orders_count}
        db.commit()
        
        logger.info(f"Synced {orders_count} orders for user {user_id}")
        return orders_count
        
    except Exception as e:
        logger.error(f"Order sync failed for user {user_id}: {str(e)}")
        if 'sync_log' in locals():
            sync_log.status = SyncStatusEnum.FAILED
            sync_log.finished_at = datetime.utcnow()
            sync_log.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


def alibaba_sync_shipments(user_id: str):
    """Sync Alibaba shipments."""
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        sync_log = create_sync_log(db, user_id, SyncKindEnum.SHIPMENTS)
        client = get_client_for_user(db, uuid.UUID(user_id))
        user_uuid = uuid.UUID(user_id)
        
        # Get all orders that need shipment updates
        orders = db.query(AlibabaOrder).filter(
            and_(
                AlibabaOrder.user_id == user_uuid,
                AlibabaOrder.fulfillment_state.in_(["PENDING", "IN_TRANSIT", "PARTIALLY_SHIPPED"])
            )
        ).all()
        
        shipments_count = 0
        
        for order in orders:
            try:
                # Fetch shipments for this order
                shipments = client.list_shipments(order.alibaba_order_id)
                
                for shipment_data in shipments:
                    # Upsert shipment
                    existing_shipment = db.query(AlibabaShipment).filter(
                        and_(
                            AlibabaShipment.user_id == user_uuid,
                            AlibabaShipment.tracking_no == shipment_data.get("tracking_number", "")
                        )
                    ).first()
                    
                    if existing_shipment:
                        # Update existing shipment
                        existing_shipment.status = shipment_data.get("status", "unknown")
                        existing_shipment.carrier = shipment_data.get("carrier", "")
                        existing_shipment.last_event_at = datetime.fromisoformat(
                            shipment_data.get("last_event_at", datetime.utcnow().isoformat())
                        )
                        existing_shipment.eta = datetime.fromisoformat(
                            shipment_data.get("eta", datetime.utcnow().isoformat())
                        ) if shipment_data.get("eta") else None
                        existing_shipment.raw = shipment_data
                    else:
                        # Create new shipment
                        new_shipment = AlibabaShipment(
                            user_id=user_uuid,
                            alibaba_order_id=order.alibaba_order_id,
                            tracking_no=shipment_data.get("tracking_number", ""),
                            status=shipment_data.get("status", "unknown"),
                            carrier=shipment_data.get("carrier", ""),
                            last_event_at=datetime.fromisoformat(
                                shipment_data.get("last_event_at", datetime.utcnow().isoformat())
                            ),
                            eta=datetime.fromisoformat(
                                shipment_data.get("eta", datetime.utcnow().isoformat())
                            ) if shipment_data.get("eta") else None,
                            raw=shipment_data
                        )
                        db.add(new_shipment)
                    
                    shipments_count += 1
                
                # Update order fulfillment state based on shipments
                if shipments:
                    # Determine fulfillment state from shipment statuses
                    shipment_statuses = [s.get("status", "") for s in shipments]
                    if all(status == "delivered" for status in shipment_statuses):
                        order.fulfillment_state = "DELIVERED"
                    elif any(status in ["in_transit", "shipped"] for status in shipment_statuses):
                        order.fulfillment_state = "IN_TRANSIT"
                    elif any(status == "shipped" for status in shipment_statuses):
                        order.fulfillment_state = "PARTIALLY_SHIPPED"
                
            except Exception as e:
                logger.warning(f"Failed to sync shipments for order {order.alibaba_order_id}: {str(e)}")
                continue
        
        db.commit()
        
        # Update sync log
        sync_log.status = SyncStatusEnum.COMPLETED
        sync_log.finished_at = datetime.utcnow()
        sync_log.stats = {"shipments_synced": shipments_count}
        db.commit()
        
        logger.info(f"Synced {shipments_count} shipments for user {user_id}")
        return shipments_count
        
    except Exception as e:
        logger.error(f"Shipment sync failed for user {user_id}: {str(e)}")
        if 'sync_log' in locals():
            sync_log.status = SyncStatusEnum.FAILED
            sync_log.finished_at = datetime.utcnow()
            sync_log.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


def alibaba_sync_suppliers(user_id: str):
    """Sync Alibaba suppliers."""
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        sync_log = create_sync_log(db, user_id, SyncKindEnum.SUPPLIERS)
        client = get_client_for_user(db, uuid.UUID(user_id))
        user_uuid = uuid.UUID(user_id)
        
        # Fetch suppliers from Alibaba
        suppliers, next_token = client.list_suppliers()
        suppliers_count = 0
        
        # Process suppliers
        for supplier_data in suppliers:
            # Upsert supplier
            existing_supplier = db.query(AlibabaSupplier).filter(
                and_(
                    AlibabaSupplier.user_id == user_uuid,
                    AlibabaSupplier.alibaba_supplier_id == supplier_data["id"]
                )
            ).first()
            
            if existing_supplier:
                # Update existing supplier
                existing_supplier.name = supplier_data.get("name", "")
                existing_supplier.email = supplier_data.get("email", "")
                existing_supplier.phone = supplier_data.get("phone", "")
                existing_supplier.location = supplier_data.get("location", "")
                existing_supplier.rating = float(supplier_data.get("rating", 0))
                existing_supplier.raw = supplier_data
            else:
                # Create new supplier
                new_supplier = AlibabaSupplier(
                    user_id=user_uuid,
                    alibaba_supplier_id=supplier_data["id"],
                    name=supplier_data.get("name", ""),
                    email=supplier_data.get("email", ""),
                    phone=supplier_data.get("phone", ""),
                    location=supplier_data.get("location", ""),
                    rating=float(supplier_data.get("rating", 0)),
                    raw=supplier_data
                )
                db.add(new_supplier)
            
            suppliers_count += 1
        
        db.commit()
        
        # Update sync log
        sync_log.status = SyncStatusEnum.COMPLETED
        sync_log.finished_at = datetime.utcnow()
        sync_log.stats = {"suppliers_synced": suppliers_count}
        db.commit()
        
        logger.info(f"Synced {suppliers_count} suppliers for user {user_id}")
        return suppliers_count
        
    except Exception as e:
        logger.error(f"Supplier sync failed for user {user_id}: {str(e)}")
        if 'sync_log' in locals():
            sync_log.status = SyncStatusEnum.FAILED
            sync_log.finished_at = datetime.utcnow()
            sync_log.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


# Convenience function for full sync
def sync_full(user_id: str):
    """Convenience function for full sync."""
    return alibaba_sync_full(user_id)