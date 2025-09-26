import { useState } from "react";

export default function FulfillmentForm({ onSubmit }) {
  const [origin, setOrigin] = useState("IN");
  const [dest, setDest] = useState("US");
  const [qty, setQty] = useState(1000);
  const [mode, setMode] = useState(["ocean","air"]);
  const [dims, setDims] = useState({ x: 30, y: 25, z: 8 });
  const [profile, setProfile] = useState("balanced");

  return (
    <form
      onSubmit={(e)=>{ e.preventDefault(); onSubmit({
        sku_spec: { category:"generic", dimensions:dims, ex_factory_total_usd: 0 }, // wire your real spec here
        qty_units: Number(qty),
        origin_country: origin,
        dest_country: dest,
        transport_modes: mode,
        profile
      });}}
      className="grid gap-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" value={origin} onChange={e=>setOrigin(e.target.value)} placeholder="Origin (e.g., IN)" />
        <input className="border rounded px-3 py-2" value={dest} onChange={e=>setDest(e.target.value)} placeholder="Destination (e.g., US)" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input className="border rounded px-3 py-2" type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Quantity" />
        <input className="border rounded px-3 py-2" type="number" value={dims.x} onChange={e=>setDims({...dims, x:Number(e.target.value)})} placeholder="L (cm)" />
        <input className="border rounded px-3 py-2" type="number" value={dims.y} onChange={e=>setDims({...dims, y:Number(e.target.value)})} placeholder="W (cm)" />
        <input className="border rounded px-3 py-2" type="number" value={dims.z} onChange={e=>setDims({...dims, z:Number(e.target.value)})} placeholder="H (cm)" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select className="border rounded px-3 py-2" value={profile} onChange={e=>setProfile(e.target.value)}>
          <option value="balanced">Balanced</option>
          <option value="cost">Cost-Optimized</option>
          <option value="speed">Speed-Optimized</option>
        </select>
        <select multiple className="border rounded px-3 py-2" value={mode} onChange={e=>setMode(Array.from(e.target.selectedOptions).map(o=>o.value))}>
          <option value="ocean">Ocean</option>
          <option value="air">Air</option>
        </select>
      </div>
      <button className="mt-1 px-4 py-2 border rounded-xl">Find Routes</button>
    </form>
  );
}
