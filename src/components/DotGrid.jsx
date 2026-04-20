import { useRef, useEffect } from 'react';

export default function DotGrid() {
  const canvasRef = useRef();
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const DOT = 22;
    let dots = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      dots = [];
      for (let x = DOT; x < canvas.width; x += DOT) {
        for (let y = DOT; y < canvas.height; y += DOT) {
          dots.push({ x, y });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;
      dots.forEach(d => {
        const dist = Math.hypot(d.x - mx, d.y - my);
        const glow = Math.max(0, 1 - dist / 120);
        const alpha = 0.12 + glow * 0.55;
        const radius = 1.2 + glow * 2.2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78,97,246,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -999, y: -999 }; };

    window.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
