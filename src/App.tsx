import { useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GML3 from 'ol/format/GML3';
import { fromLonLat } from 'ol/proj';

import Overlay from 'ol/Overlay';

import { wfsGmlUrl } from './map/wfs';
import { regionStyle, shelterStyle } from './map/styles';

const REGIONS_TYPENAME = 'layer_185';
const SHELTERS_TYPENAME = 'layer_340';

type ShelterProps = Record<string, unknown>;

function cleanShelterProps(raw: ShelterProps): ShelterProps {
  const {
    geometry,
    ___hover,
    boundedBy,
    msGeometry,
    _revision,
    _extent,
    extent_,
    _listeners,
    listeners_,
    ol_uid,
    ...rest
  } = raw as any;

  if (rest.values_ && typeof rest.values_ === 'object') {
    return { ...(rest.values_ as object) } as ShelterProps;
  }
  return rest as ShelterProps;
}

function getString(props: ShelterProps, keys: string[]) {
  for (const k of keys) {
    const v = props[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
}

export default function App() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);

  const [selectedShelter, setSelectedShelter] = useState<ShelterProps | null>(null);

  const regionsSource = useMemo(
    () =>
      new VectorSource({
        url: wfsGmlUrl(REGIONS_TYPENAME),
        format: new GML3(),
      }),
    [],
  );

  const sheltersSource = useMemo(
    () =>
      new VectorSource({
        url: wfsGmlUrl(SHELTERS_TYPENAME),
        format: new GML3(),
      }),
    [],
  );

  useEffect(() => {
    if (!mapDivRef.current) return;
    if (!popupRef.current) return;
    if (mapRef.current) return;

    const regionsLayer = new VectorLayer({
      source: regionsSource,
      style: regionStyle,
    });

    const sheltersLayer = new VectorLayer({
      source: sheltersSource,
      style: shelterStyle,
    });

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: { animation: { duration: 200 } },
      offset: [0, -12],
      positioning: 'bottom-center',
      stopEvent: true,
    });

    const map = new Map({
      target: mapDivRef.current,
      overlays: [overlay],
      layers: [new TileLayer({ source: new OSM() }), regionsLayer, sheltersLayer],
      view: new View({
        center: fromLonLat([10.75, 59.91]),
        zoom: 6,
      }),
    });

    overlayRef.current = overlay;

    // --- Hover style (begge lag) ---
    let lastHoverFeature: any = null;

    map.on('pointermove', (evt) => {
      if (evt.dragging) return;

      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

      if (lastHoverFeature && lastHoverFeature !== feature) {
        lastHoverFeature.set('___hover', false);
      }
      if (feature) {
        feature.set('___hover', true);
      }
      lastHoverFeature = feature ?? null;
    });

    const closePopup = () => {
      setSelectedShelter(null);
      overlay.setPosition(undefined);
    };

    // Lukk popup om du klikker på tomt område eller på polygon
    map.on('singleclick', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

      if (!feature) {
        closePopup();
        return;
      }

      const geomType = feature.getGeometry()?.getType();

      // Klikk på polygon gjør ingenting
      if (geomType !== 'Point') {
        closePopup();
        return;
      }

      const cleaned = cleanShelterProps(feature.getProperties() as ShelterProps);
      setSelectedShelter(cleaned);
      overlay.setPosition(evt.coordinate);
    });

    mapRef.current = map;
  }, [regionsSource, sheltersSource]);

  const address = selectedShelter ? getString(selectedShelter, ['adresse', 'ADRESSE', 'Adresse']) : '';
  const places = selectedShelter
    ? getString(selectedShelter, ['plasser', 'PLASSER', 'kapasitet', 'KAPASITET'])
    : '';
  const room = selectedShelter ? getString(selectedShelter, ['romnr', 'ROMNR', 'Romnr']) : '';
  const category = selectedShelter ? getString(selectedShelter, ['t_kategori', 'T_KATEGORI']) : '';

  const closePopupButton = () => {
    setSelectedShelter(null);
    overlayRef.current?.setPosition(undefined);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />

      {/* Popup overlay */}
      <div
        ref={popupRef}
        style={{
          display: selectedShelter ? 'block' : 'none',
          minWidth: 260,
          maxWidth: 340,
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.15)',
          boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
          padding: 16,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1.05 }}>Tilfluktsrom</div>
          <button
            onClick={closePopupButton}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 26,
              lineHeight: 1,
              padding: 0,
              marginTop: 2,
            }}
            aria-label="Close"
            title="Lukk"
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Adresse</div>
          <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1.05 }}>
            {address || 'Ukjent'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Plasser</div>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{places || 'Ukjent'}</div>
            </div>

            <div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Romnr</div>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{room || 'Ukjent'}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Kategori</div>
            <div style={{ fontWeight: 900, fontSize: 28 }}>{category || 'Ukjent'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}