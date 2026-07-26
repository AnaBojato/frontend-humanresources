import { useCallback, useEffect, useState } from 'react';
import './BannerCarrusel.css';

interface BannerCarruselProps {
  imagenes: string[];
  intervaloMs?: number;
}

export default function BannerCarrusel({ imagenes, intervaloMs = 6000 }: BannerCarruselProps) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  const siguiente = useCallback(() => {
    setIndice((i) => (i + 1) % imagenes.length);
  }, [imagenes.length]);

  useEffect(() => {
    if (pausado || imagenes.length <= 1) return;
    const id = setInterval(siguiente, intervaloMs);
    return () => clearInterval(id);
  }, [pausado, intervaloMs, siguiente, imagenes.length]);

  return (
    <div
      className="carrusel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {imagenes.map((src, i) => (
        <div
          key={src}
          className={`carrusel__slide ${i === indice ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      <div className="carrusel__overlay" />

      {imagenes.length > 1 && (
        <div className="carrusel__dots">
          {imagenes.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`carrusel__dot ${i === indice ? 'is-active' : ''}`}
              aria-label={`Ir a la imagen ${i + 1}`}
              onClick={() => setIndice(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}