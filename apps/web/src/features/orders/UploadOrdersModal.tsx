import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { uploadOrdersSheet, uploadOrderFiles, createOrder } from "@/services/ordersUploadService";
import { useOrdersStore } from "@/stores/ordersStore";

type Mode = "sheet" | "files" | "manual";
type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function UploadOrdersModal({ open, onOpenChange }: Props) {
  const [mode, setMode] = useState<Mode>("sheet");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { addMany, add } = useOrdersStore();

  useEffect(() => { if (open) setMode("sheet"); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-3xl md:max-w-4xl">
        <div className="max-h-[85vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle>Add order</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Import a spreadsheet, upload files, or add an order manually.
            </p>
          </DialogHeader>

          <div className="px-6 pb-4 overflow-y-auto space-y-6">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={mode==="sheet" ? "default" : "outline"} onClick={() => setMode("sheet")}>Spreadsheet</Button>
              <Button size="sm" variant={mode==="files" ? "default" : "outline"} onClick={() => setMode("files")}>Files</Button>
              <Button size="sm" variant={mode==="manual" ? "default" : "outline"} onClick={() => setMode("manual")}>Manual</Button>
            </div>

            {mode === "sheet" && <SheetPane busy={busy} setBusy={setBusy} onDone={(list:any[])=>{
              addMany(list); toast({ title:"Orders imported", description:`Added ${list.length}.` }); onOpenChange(false);
            }} />}

            {mode === "files" && <FilesPane busy={busy} setBusy={setBusy} onDone={(list:any[])=>{
              addMany(list); toast({ title:"Files uploaded", description:`Added ${list.length} orders.` }); onOpenChange(false);
            }} />}

            {mode === "manual" && <ManualPane busy={busy} setBusy={setBusy} onDone={(order:any)=>{
              add(order); toast({ title:"Order added", description: order.orderNo || order.reference || "Order" }); onOpenChange(false);
            }} />}
          </div>

          <div className="px-6 py-4 border-t bg-background sticky bottom-0 flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SheetPane({ busy, setBusy, onDone }:{ busy:boolean; setBusy:(b:boolean)=>void; onDone:(list:any[])=>void }) {
  const [files, setFiles] = useState<File[]>([]);
  const accept = ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <label className="block border border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer hover:bg-muted/40">
        <input type="file" multiple className="hidden" accept={accept}
          onChange={(e)=>setFiles(Array.from(e.currentTarget.files || []))}/>
        <div className="text-base">Drag & drop or click to select spreadsheet files</div>
        <div className="mt-1 text-xs text-muted-foreground">Accepted: .csv, .xlsx</div>
      </label>
      {!!files.length && <FileList files={files} />}
      <div className="flex justify-between gap-2">
        <Button variant="ghost" disabled={busy} onClick={()=>setFiles([])}>Clear</Button>
        <Button disabled={!files.length||busy} onClick={async()=>{
          try{ setBusy(true); const res = await uploadOrdersSheet(files); onDone(res?.created||[]); }
          catch(e:any){ toast({ title:"Upload failed", description:String(e?.message||e), variant:"destructive" }); }
          finally{ setBusy(false); }
        }}>{busy?"Uploading…":"Upload"}</Button>
      </div>
    </div>
  );
}

function FilesPane({ busy, setBusy, onDone }:{ busy:boolean; setBusy:(b:boolean)=>void; onDone:(list:any[])=>void }) {
  const [files, setFiles] = useState<File[]>([]);
  const accept = ".pdf,.png,.jpg,.jpeg";
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <label className="block border border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer hover:bg-muted/40">
        <input type="file" multiple className="hidden" accept={accept}
          onChange={(e)=>setFiles(Array.from(e.currentTarget.files || []))}/>
        <div className="text-base">Drag & drop or click to select PO/Order files</div>
        <div className="mt-1 text-xs text-muted-foreground">Accepted: .pdf, .png, .jpg</div>
      </label>
      {!!files.length && <FileList files={files} />}
      <div className="flex justify-between gap-2">
        <Button variant="ghost" disabled={busy} onClick={()=>setFiles([])}>Clear</Button>
        <Button disabled={!files.length||busy} onClick={async()=>{
          try{ setBusy(true); const res = await uploadOrderFiles(files); onDone(res?.created||[]); }
          catch(e:any){ toast({ title:"Upload failed", description:String(e?.message||e), variant:"destructive" }); }
          finally{ setBusy(false); }
        }}>{busy?"Uploading…":"Upload"}</Button>
      </div>
    </div>
  );
}

function ManualPane({ busy, setBusy, onDone }:{ busy:boolean; setBusy:(b:boolean)=>void; onDone:(order:any)=>void }) {
  const [form, setForm] = useState<any>({
    orderNo:"", client:"", vendor:"", sku:"", quantity:"", unitPrice:"", currency:"USD",
    incoterm:"", expectedShipDate:"", status:"Open", notes:""
  });
  const valid = form.orderNo && form.client && form.vendor;
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input placeholder="Order No." value={form.orderNo} onChange={e=>setForm({...form, orderNo:e.target.value})}/>
        <Input placeholder="Client" value={form.client} onChange={e=>setForm({...form, client:e.target.value})}/>
        <Input placeholder="Vendor" value={form.vendor} onChange={e=>setForm({...form, vendor:e.target.value})}/>
        <Input placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})}/>
        <Input placeholder="Qty" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})}/>
        <Input placeholder="Unit Price" value={form.unitPrice} onChange={e=>setForm({...form, unitPrice:e.target.value})}/>
        <Input placeholder="Currency" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}/>
        <Input placeholder="Incoterm (e.g., FOB, CIF)" value={form.incoterm} onChange={e=>setForm({...form, incoterm:e.target.value})}/>
        <Input placeholder="Expected Ship Date (YYYY-MM-DD)" value={form.expectedShipDate} onChange={e=>setForm({...form, expectedShipDate:e.target.value})}/>
        <Input placeholder="Status" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}/>
        <Textarea placeholder="Notes" className="md:col-span-2 min-h-[96px]" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={busy} onClick={()=>onDone({})}>Skip</Button>
        <Button disabled={!valid||busy} onClick={async()=>{
          try{ setBusy(true); const res = await createOrder(form); onDone(res?.order || form); }
          catch(e:any){ toast({ title:"Save failed", description:String(e?.message||e), variant:"destructive" }); }
          finally{ setBusy(false); }
        }}>{busy?"Saving…":"Save order"}</Button>
      </div>
    </div>
  );
}

function FileList({ files }:{ files:File[] }) {
  return <ul className="max-h-44 overflow-auto text-sm mt-1 space-y-1">{files.map(f=><li key={f.name} className="truncate">{f.name}</li>)}</ul>;
}
