import React, { useEffect, useState } from "react";
import { PopupButton } from "@typeform/embed-react";
// import from /public with ?url to avoid stale caching during dev
import mockup from "/images/Mockup1.png?url";

export default function Ecommerce() {
  // Responsive popup size (bigger on mobile)
  const [popupSize, setPopupSize] = useState(60);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setPopupSize(mq.matches ? 95 : 60); // bigger modal on phones
    set(); mq.addEventListener?.("change", set);
    return () => mq.removeEventListener?.("change", set);
  }, []);

  // Hidden fields for Typeform (UTM params + page tracking)
  const hiddenFields = (() => {
    if (typeof window === "undefined") return { page: "ecommerce" };
    const q = new URLSearchParams(window.location.search);
    return {
      utm_source: q.get("utm_source") || "",
      utm_medium: q.get("utm_medium") || "",
      utm_campaign: q.get("utm_campaign") || "",
      page: "ecommerce",
    };
  })();

  return (
    <main className="font-sans min-h-screen bg-white text-gray-900">
      {/* HERO (mobile-optimized) */}
      <section className="relative mx-auto max-w-none overflow-hidden">
        {/* overlay link (smaller) */}
        <a
          href="/"
          aria-label="Go to SLA Enterprise"
          className="absolute left-3 sm:left-6 top-[calc(env(safe-area-inset-top)+8px)] z-20
                     inline-flex items-center gap-1 text-xs sm:text-sm font-medium
                     text-gray-800/80 hover:text-gray-900 transition"
        >
          <span className="font-semibold tracking-tight">SLA</span>
          <span className="text-gray-700">[enterprise]</span>
        </a>

        {/* gradient layer (approximate the pink→blue in Mockup1) */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              // two large, soft radial blobs to mimic the mockup background
              "radial-gradient(1200px 800px at 15% 30%, #f7b1cc 0%, rgba(247,177,204,0) 60%)," +
              "radial-gradient(1200px 800px at 85% 70%, #90bfff 0%, rgba(144,191,255,0) 60%)",
          }}
        />
        {/* subtle white veil for readability */}
        <div className="absolute inset-0 -z-10 bg-white/20" />

        <div
          className="
            mx-auto max-w-6xl px-4
            pt-10 md:pt-12
            pb-10 md:pb-12
            min-h-[88vh] lg:min-h-[92vh]
            flex flex-col
          "
        >
          <h1 className="text-5xl md:text-[64px] font-semibold leading-tight tracking-tight text-center">
            sourcing simplified.
          </h1>

          {/* Decorative product images (pulled in from edges + blurred glows) */}
          <div className="pointer-events-none absolute inset-0 -z-0 hidden md:block">
            {/* feather the image edges a bit so they melt into the page */}
            <style>{`
              .fade-oval {
                -webkit-mask-image: radial-gradient(80% 68% at 50% 50%, #000 68%, transparent 100%);
                        mask-image: radial-gradient(80% 68% at 50% 50%, #000 68%, transparent 100%);
              }
            `}</style>

            {/* LEFT — upper */}
            <div className="absolute left-[7%] top-[14%]">
              {/* color glow behind */}
              <div className="absolute -inset-10 rounded-full
                              bg-[radial-gradient(550px_400px_at_35%_35%,#0b2a5a_0%,rgba(11,42,90,0)_70%)]
                              blur-3xl opacity-60"></div>
              <div className="relative w-[200px] lg:w-[220px] xl:w-[240px]
                              rounded-[28px] overflow-hidden fade-oval
                              ring-1 ring-black/10 shadow-[0_20px_50px_rgba(0,0,0,.12)]">
                <img
                  src="/images/ProductImage1.1.png"
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* RIGHT — middle */}
            <div className="absolute right-[8%] top-[34%]">
              <div className="absolute -inset-10 rounded-full
                              bg-[radial-gradient(520px_380px_at_65%_40%,#3fb74f_0%,rgba(63,183,79,0)_72%)]
                              blur-3xl opacity-60"></div>
              <div className="relative w-[190px] lg:w-[210px] xl:w-[230px]
                              rounded-[28px] overflow-hidden fade-oval
                              ring-1 ring-black/10 shadow-[0_20px_50px_rgba(0,0,0,.12)]">
                <img
                  src="/images/ProductImage1.2.png"
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* LEFT — lower */}
            <div className="absolute left-[12%] bottom-[8%]">
              <div className="absolute -inset-10 rounded-full
                              bg-[radial-gradient(520px_380px_at_45%_60%,#0aa5a5_0%,rgba(10,165,165,0)_72%)]
                              blur-3xl opacity-60"></div>
              <div className="relative w-[170px] lg:w-[190px] xl:w-[210px]
                              rounded-[28px] overflow-hidden fade-oval
                              ring-1 ring-black/10 shadow-[0_20px_50px_rgba(0,0,0,.12)]">
                <img
                  src="/images/ProductImage1.3.png"
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* main mockup */}
          <div className="mt-8 md:mt-8 lg:mt-10 mb-0 flex justify-center">
            <img
              src={mockup}
              alt="SLA mobile mockup"
              className="
                w-[86%] max-w-[820px]
                md:w-[58%] md:max-w-[900px]
                lg:w-[56%] lg:max-w-[920px]
                rounded-[28px] ring-1 ring-black/10
                shadow-[0_24px_80px_rgba(0,0,0,.16)]
              "
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>

          {/* CTA: full-width on phones for easier tap */}
          <div className="mt-6 md:mt-8 lg:mt-10 flex justify-center">
            <PopupButton
              id="uuQvUuyW"
              hidden={hiddenFields}
              size={popupSize}
              className="w-full sm:w-auto rounded-full bg-gray-900 text-white px-6 py-3 text-sm font-semibold hover:opacity-90"
            >
              Join the Waitlist
            </PopupButton>
          </div>

          {/* Mobile-only floating product previews (below CTA) */}
          <div className="md:hidden mt-6 px-6 relative h-36 pointer-events-none select-none">
            {/* LEFT item (sunglasses) */}
            <div
              className="absolute left-0 top-8 animate-[float_6s_ease-in-out_infinite] drop-shadow-xl"
              style={{ animationDelay: "0s" }}
            >
              {/* colored glow */}
              <span className="absolute -z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full blur-2xl opacity-50 bg-sky-300"></span>
              {/* unified box size; slight scale for better visual weight */}
              <div className="h-16 w-16 rounded-[18px] overflow-hidden">
                <img
                  src="/images/ProductImage1.1.png"
                  alt="Preview product"
                  className="h-full w-full object-contain scale-110"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* CENTER item (razors) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-2 animate-[float_5.5s_ease-in-out_infinite] drop-shadow-xl"
              style={{ animationDelay: "0.25s" }}
            >
              <span className="absolute -z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full blur-2xl opacity-50 bg-emerald-300"></span>
              <div className="h-16 w-16 rounded-[18px] overflow-hidden">
                <img
                  src="/images/ProductImage1.2.png"
                  alt="Preview product"
                  className="h-full w-full object-contain scale-90"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* RIGHT item (vac) */}
            <div
              className="absolute right-0 top-12 animate-[float_6.5s_ease-in-out_infinite] drop-shadow-xl"
              style={{ animationDelay: "0.5s" }}
            >
              <span className="absolute -z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full blur-2xl opacity-50 bg-lime-300"></span>
              <div className="h-16 w-16 rounded-[18px] overflow-hidden">
                <img
                  src="/images/ProductImage1.3.png"
                  alt="Preview product"
                  className="h-full w-full object-contain scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features (left-aligned, no header visible, styled like About SLA) ===== */}
      <section id="features" aria-labelledby="features-label" className="py-12 sm:py-16 lg:py-24 bg-white border-t">
        <h2 id="features-label" className="sr-only">SLA Mobile App Features</h2>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro paragraph — centered */}
          <div className="mb-12 sm:mb-16 text-center">
            <p className="text-lg md:text-xl text-gray-700">
              Find & launch winning products in minutes with SLA.
            </p>
          </div>

          {/* Core capabilities — simple text blocks, no cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Source in seconds</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Describe your item and target market, pick a country, and get an AI-ranked list of factory matches
                  with MOQs, lead times, certifications, and reliability signals. Filter by product type, region,
                  compliance, and capacity to land on the best fit fast.
                </p>
              </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Quote custom products</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Upload sketches or photos, select materials and options, then send structured RFQs in one tap.
                    </p>
                  </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Save suppliers</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Bookmark vetted factories, tag by product line, season, or region, and keep notes and attachments
                  in one place. Share shortlists with your team to keep launches coordinated.
                </p>
              </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Maximize margins</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Our landed-cost engine models materials, labor, freight, duty, and packaging to reveal the
                      <strong> lowest-total-cost</strong> options. Simulate margin across order sizes, compare near-shore vs off-shore,
                      and get negotiation insights to bring costs down and margins up.
                    </p>
                  </div>
            </div>
          </div>

          {/* Closing line (italic), same typographic scale as About's small print */}
          <div className="mt-12 sm:mt-16 text-left">
            <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-5xl leading-relaxed font-medium italic">
              it's not fancy, it's functional.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 max-w-5xl leading-relaxed font-bold mt-2">
              SLA. sourcing simplified
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}