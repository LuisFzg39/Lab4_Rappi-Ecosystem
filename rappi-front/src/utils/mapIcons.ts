import L from 'leaflet';

const pinSvg = (color: string): string => `
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
          fill="${color}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#ffffff"/>
  </svg>`;

const buildPinIcon = (color: string): L.DivIcon =>
  L.divIcon({
    html: pinSvg(color),
    className: 'map-pin-icon',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });

export const destinationIcon = buildPinIcon('#dc2626');
export const deliveryIcon = buildPinIcon('#2563eb');
