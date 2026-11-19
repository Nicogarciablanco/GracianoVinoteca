import { provinces } from './shipping';
import type { NationalDestination } from './shipping';

export function NationalDestinationFields({ destination, change, showLocation, showAddress, onConsult }: {
  destination: NationalDestination;
  change: (destination: NationalDestination) => void;
  showLocation: boolean;
  showAddress?: boolean;
  onConsult?: () => void;
}) {
  return (
    <>
      <label className="field">Código postal
        <input autoComplete="off" autoCapitalize="characters" spellCheck={false}
          maxLength={8} required={showAddress} value={destination.postal}
          placeholder="4 dígitos o CPA"
          onChange={(event) => change({ ...destination, postal: event.target.value.toUpperCase() })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onConsult) {
              event.preventDefault();
              onConsult();
            }
          }} />
      </label>
      {showLocation && <>
        <label className="field">Provincia o CABA
          <select value={destination.province} required={showAddress}
            onChange={(event) => change({ ...destination, province: event.target.value, locality: '' })}>
            <option value="">Seleccioná una jurisdicción</option>
            {provinces.map((province) => <option key={province}>{province}</option>)}
          </select>
        </label>
        <label className="field">Localidad
          <input autoComplete="off" maxLength={80} required={showAddress}
            value={destination.locality} placeholder="Localidad de prueba"
            onChange={(event) => change({ ...destination, locality: event.target.value })} />
        </label>
      </>}
      {showAddress && <>
        <div className="field-row">
          <label className="field">Calle<input autoComplete="off" maxLength={100} pattern={'.*\\S.*'} required
            value={destination.street} placeholder="Calle de ejemplo"
            onChange={(event) => change({ ...destination, street: event.target.value })} /></label>
          <label className="field">Número<input autoComplete="off" inputMode="numeric" maxLength={8}
            pattern="[0-9]{1,8}" required value={destination.number} placeholder="123"
            onChange={(event) => change({ ...destination, number: event.target.value })} /></label>
        </div>
        <label className="field">Piso / departamento (opcional)
          <input autoComplete="off" maxLength={40} value={destination.unit}
            onChange={(event) => change({ ...destination, unit: event.target.value })} />
        </label>
      </>}
    </>
  );
}
