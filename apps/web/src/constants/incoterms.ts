export const INCOTERMS = [
  "EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"
] as const;

export const INCOTERM_FIELD_HINTS: Record<string, {required: string[]; optional: string[]; tip: string;}> = {
  EXW: { required:["origin_city"], optional:["origin_port","dest_city","dest_port"], tip:"Buyer picks up at seller's site; buyer handles export" },
  FCA: { required:["origin_city"], optional:["origin_port","dest_city","dest_port"], tip:"Seller hands to buyer's carrier; seller clears export" },
  FAS: { required:["origin_port"], optional:["dest_port"], tip:"Alongside vessel at origin port" },
  FOB: { required:["origin_port"], optional:["dest_port"], tip:"Onboard vessel at origin port" },
  CFR: { required:["origin_port","dest_port"], optional:[], tip:"Cost+Freight to destination port; risk onboard" },
  CIF: { required:["origin_port","dest_port"], optional:[], tip:"Like CFR + seller insurance" },
  CPT: { required:["dest_city"], optional:["origin_city"], tip:"Carriage paid to named place" },
  CIP: { required:["dest_city"], optional:["origin_city"], tip:"Like CPT + insurance" },
  DAP: { required:["dest_city"], optional:["origin_city"], tip:"Delivered at place (not unloaded); buyer imports" },
  DPU: { required:["dest_city"], optional:["origin_city"], tip:"Delivered unloaded; buyer imports" },
  DDP: { required:["dest_city"], optional:["origin_city"], tip:"Seller handles import+duties to destination" },
};