import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

// Custom hook for dynamic square sizing
function useSquareSize(containerRef, pad = 0) {
  const [size, setSize] = useState(480);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const s = Math.floor(Math.min(rect.width, rect.height) - pad);
      setSize(Math.max(200, s)); // clamp minimum size
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, pad]);

  return size;
}

const WorldGlobe = ({ data = [], cycleMs = 2200, className = '', autoRotate = true }) => {
  const hostRef = useRef(null);
  const globeRef = useRef(null);

  // Dynamic square size based on container
  const size = useSquareSize(hostRef, 16);

  // Filter out factories with invalid coordinates
  const validFactories = data.filter(f => 
    Number.isFinite(f.lat) && Number.isFinite(f.lng) && 
    f.lat !== 0 && f.lng !== 0
  );

  // Cycle through factories one at a time
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!validFactories?.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % validFactories.length), cycleMs);
    return () => clearInterval(t);
  }, [validFactories?.length, cycleMs]);

  const selected = validFactories?.length ? [validFactories[idx]] : [];

  // simple "pop" by toggling altitude; transition handles animation
  const [popToggle, setPopToggle] = useState(false);
  useEffect(() => {
    setPopToggle(true);
    const down = setTimeout(() => setPopToggle(false), Math.max(600, cycleMs - 800));
    return () => clearTimeout(down);
  }, [idx, cycleMs]);

  const pointAltitude = useMemo(
    () => (d) => (popToggle ? 0.2 : 0.02),
    [popToggle]
  );

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8; // Slightly faster for thinking animation

    const onStart = () => (controls.autoRotate = false);
    const onEnd = () => (controls.autoRotate = autoRotate);
    
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    // ensure centered sphere (no odd scaling)
    const obj = globeRef.current.scene();
    obj.scale.set(1, 1, 1);

    // Set initial POV for better vertical rotation visibility
    globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.0 }, 0);
    
    // Ensure rotation around vertical axis (Y)
    const camera = globeRef.current.camera();
    if (camera) {
      camera.up.set(0, 1, 0);
    }

    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, [autoRotate]);

  // Optional: Camera easing to selected point
  useEffect(() => {
    if (!globeRef.current || !selected.length) return;
    const { lat, lng } = selected[0];
    globeRef.current.pointOfView({ lat, lng, altitude: 2.4 }, 900);
  }, [idx]);

  return (
    <div className={`grid place-items-center ${className}`}>
      {/* Host container keeps the globe centered and square */}
      <div
        ref={hostRef}
        className="relative mx-auto"
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <Globe
            ref={globeRef}
            width={size}
            height={size}
            backgroundColor="rgba(0,0,0,0)"
            showAtmosphere
            atmosphereAltitude={0.15}

            // Earth textures (use CDN now; we can replace with /public later)
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-day.jpg"
            bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"

            // Display ONE pin + label at a time
            pointsData={selected}
            pointLat="lat"
            pointLng="lng"
            pointColor={(d) => (d.status === 'new' ? '#3B82F6' : '#EF4444')}
            pointAltitude={pointAltitude}
            pointRadius={0.8}
            pointsTransitionDuration={700}

            labelsData={selected}
            labelLat="lat"
            labelLng="lng"
            labelText={(d) => d.name}
            labelSize={1.2}
            labelDotRadius={0.6}
            labelColor={() => 'rgba(17,24,39,0.92)'}
            labelResolution={2}
          />
        </div>
      </div>
    </div>
  );
};

export default WorldGlobe;