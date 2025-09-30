import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { uploadClientsSheet, uploadClientFiles, createClient } from "@/services/clientsUploadService";
import { useSavedClients } from "@/stores/savedClients";

type Mode = "sheet" | "files" | "manual";
type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function UploadClientsModal({ open, onOpenChange }: Props) {
  const [mode, setMode] = useState<Mode>("sheet");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const addMany = (useSavedClients as any)?.getState?.().addMany ?? (() => {});
  const addOne  = (useSavedClients as any)?.getState?.().add ?? (() => {});

  useEffect(() => { if (open) setMode("sheet"); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wider, taller, clean padding; content uses its own scroll area */}
      <DialogContent className="p-0 sm:max-w-3xl md:max-w-4xl">
        <div className="max-h-[85vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle>Upload clients</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Import a spreadsheet, upload files, or add a client manually.
            </p>
          </DialogHeader>

          {/* content area: scrollable */}
          <div className="px-6 pb-4 overflow-y-auto space-y-6">
            {/* Mode toggle — mirrors Vendors style */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant={mode==="sheet" ? "default" : "outline"} onClick={() => setMode("sheet")}>Spreadsheet</Button>
              <Button size="sm" variant={mode==="files" ? "default" : "outline"} onClick={() => setMode("files")}>Files</Button>
              <Button size="sm" variant={mode==="manual" ? "default" : "outline"} onClick={() => setMode("manual")}>Manual</Button>
            </div>

            {mode === "sheet" && (
              <SheetPane
                busy={busy}
                setBusy={setBusy}
                onDone={(list:any[]) => {
                  addMany(list);
                  toast({ title:"Clients imported", description:`Added ${list?.length ?? 0}.` });
                  onOpenChange(false);
                }}
              />
            )}

            {mode === "files" && (
              <FilesPane
                busy={busy}
                setBusy={setBusy}
                onDone={(list:any[]) => {
                  addMany(list);
                  toast({ title:"Files uploaded", description:`Added ${list?.length ?? 0} client records.` });
                  onOpenChange(false);
                }}
              />
            )}

            {mode === "manual" && (
              <ManualPane
                busy={busy}
                setBusy={setBusy}
                onDone={(client:any) => {
                  addOne(client);
                  toast({ title:"Client added", description: client.company || client.name });
                  onOpenChange(false);
                }}
              />
            )}
          </div>

          {/* sticky footer for actions (per-pane buttons live inside panes, so this is just a close affordance) */}
          <div className="px-6 py-4 border-t bg-background sticky bottom-0 flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Sub panes (roomier spacing) ---------------- */

function SheetPane({ busy, setBusy, onDone }:{
  busy:boolean; setBusy:(b:boolean)=>void; onDone:(list:any[])=>void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const accept = ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return (
    <div className="space-y-4">
      <label className="block border border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer hover:bg-muted/40">
        <input type="file" multiple className="hidden" accept={accept}
          onChange={(e)=>setFiles(Array.from(e.currentTarget.files || []))} />
        <div className="text-base">Drag & drop or click to select spreadsheet files</div>
        <div className="mt-1 text-xs text-muted-foreground">Accepted: .csv, .xlsx</div>
      </label>

      {!!files.length && <FileList files={files} />}

      <div className="sticky bottom-0 bg-background pt-2">
        <div className="flex justify-between gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => setFiles([])}>Clear</Button>
          <Button disabled={!files.length || busy} onClick={async ()=>{
            try{
              setBusy(true);
              const res = await uploadClientsSheet(files); // { created: SavedClient[] }
              onDone(res?.created || []);
            } catch(e:any){ toast({ title:"Upload failed", description:String(e?.message||e), variant:"destructive" }); }
            finally{ setBusy(false); }
          }}>{busy ? "Uploading…" : "Upload"}</Button>
        </div>
      </div>
    </div>
  );
}

function FilesPane({ busy, setBusy, onDone }:{
  busy:boolean; setBusy:(b:boolean)=>void; onDone:(list:any[])=>void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const accept = ".pdf,.png,.jpg,.jpeg";

  return (
    <div className="space-y-4">
      <label className="block border border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer hover:bg-muted/40">
        <input type="file" multiple className="hidden" accept={accept}
          onChange={(e)=>setFiles(Array.from(e.currentTarget.files || []))} />
        <div className="text-base">Drag & drop or click to select client files</div>
        <div className="mt-1 text-xs text-muted-foreground">Accepted: .pdf, .png, .jpg</div>
      </label>

      {!!files.length && <FileList files={files} />}

      <div className="sticky bottom-0 bg-background pt-2">
        <div className="flex justify-between gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => setFiles([])}>Clear</Button>
          <Button disabled={!files.length || busy} onClick={async ()=>{
            try{
              setBusy(true);
              const res = await uploadClientFiles(files); // { created: SavedClient[] }
              onDone(res?.created || []);
            } catch(e:any){ toast({ title:"Upload failed", description:String(e?.message||e), variant:"destructive" }); }
            finally{ setBusy(false); }
          }}>{busy ? "Uploading…" : "Upload"}</Button>
        </div>
      </div>
    </div>
  );
}

function ManualPane({ busy, setBusy, onDone }:{
  busy:boolean; setBusy:(b:boolean)=>void; onDone:(client:any)=>void;
}) {
  const [form, setForm] = useState<any>({ company:"", contact:"", email:"", phone:"", address:"", city:"", state:"", country:"", notes:"" });
  const valid = (form.company || form.name) && (form.email || form.phone);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input placeholder="Company / Name" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})}/>
        <Input placeholder="Contact person" value={form.contact} onChange={(e)=>setForm({...form, contact:e.target.value})}/>
        <Input placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}/>
        <Input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})}/>
        <Input placeholder="Address" value={form.address} onChange={(e)=>setForm({...form, address:e.target.value})}/>
        <Input placeholder="City" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})}/>
        <Input placeholder="State/Province" value={form.state} onChange={(e)=>setForm({...form, state:e.target.value})}/>
        <Input placeholder="Country" value={form.country} onChange={(e)=>setForm({...form, country:e.target.value})}/>
        <Textarea placeholder="Notes" className="md:col-span-2 min-h-[96px]" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})}/>
      </div>

      <div className="sticky bottom-0 bg-background pt-2">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={()=>onDone({})}>Skip</Button>
          <Button disabled={!valid || busy} onClick={async ()=>{
            try{
              setBusy(true);
              const res = await createClient(form); // -> { client }
              onDone(res?.client || form);
            } catch(e:any){ toast({ title:"Save failed", description:String(e?.message||e), variant:"destructive" }); }
            finally{ setBusy(false); }
          }}>{busy ? "Saving…" : "Save client"}</Button>
        </div>
      </div>
    </div>
  );
}

function FileList({ files }:{ files:File[] }) {
  return (
    <ul className="max-h-44 overflow-auto text-sm mt-1 space-y-1 text-left">
      {files.map((f)=> <li key={f.name} className="truncate">{f.name}</li>)}
    </ul>
  );
}