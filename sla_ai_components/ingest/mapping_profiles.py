from __future__ import annotations

# Stubs; replace with DB queries
_STORE = {}

def save_profile(tenant_id: str, sheet_type: str, mapping_yaml: str, profile_name: str):
    _STORE[(tenant_id, sheet_type)] = {"mapping_yaml": mapping_yaml, "profile_name": profile_name}

def get_profile_for_tenant(tenant_id: str, sheet_type: str):
    return _STORE.get((tenant_id, sheet_type))
