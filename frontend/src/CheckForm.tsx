import { useState, useEffect } from "react";
import type { Vehicle, CheckItem, CheckItemKey, ErrorResponse } from "./types";
import { api } from "./api";

const CHECK_ITEMS: CheckItemKey[] = ["TYRES", "BRAKES", "LIGHTS"];

interface Props {
  onSuccess: () => void;
}

export function CheckForm({ onSuccess }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [items, setItems] = useState<CheckItem[]>(
    CHECK_ITEMS.map((key) => ({ key, status: true as unknown as "OK" })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    api.getVehicles().then(setVehicles).catch(console.error);
  }, []);

  const handleItemStatusChange = (key: CheckItemKey, status: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, status: status as unknown as "OK" | "FAIL" }
          : item,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);
    setLoading(true);

    try {
      await api.createCheck({
        vehicleId: selectedVehicle,
        odometerKm: parseFloat(odometerKm),
        items,
      });

      // Reset form and display success notification
      setSelectedVehicle("");
      setOdometerKm("");
      setItems(
        CHECK_ITEMS.map((key) => ({ key, status: true as unknown as "OK" })),
      );
      onSuccess();
    } catch (err: unknown) {
      const errorResponse = err as ErrorResponse;
      if (errorResponse.error?.details) {
        setValidationErrors(
          errorResponse.error.details.map((d) => `${d.field}: ${d.reason}`),
        );
      } else {
        setError("Failed to submit check. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="check-form">
      <h2>Submit Vehicle Inspection Result</h2>
      {error && <div className="error-banner">{error}</div>}
      {validationErrors.length > 0 && (
        <div className="error-banner">
          <strong>Validation errors:</strong>
          <ul>
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="vehicle">Vehicle *</label>
        <select
          id="vehicle"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          required
        >
          <option value="">Select a vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registration} - {v.make} {v.model} ({v.year})
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="odometer">Odometer (km) *</label>
        <input
          id="odometer"
          type="number"
          value={odometerKm}
          onChange={(e) => setOdometerKm(e.target.value)}
          placeholder="Enter odometer reading"
          required
        />
      </div>
      <div className="form-group">
        <label>Checklist Items *</label>
        <div className="checklist">
          {items.map((item) => (
            <div key={item.key} className="checklist-item">
              <span className="item-label">{item.key}</span>
              <label>
                <input
                  type="radio"
                  name={`status-${item.key}`}
                  value="OK"
                  checked={item.status === "OK"}
                  onChange={() => handleItemStatusChange(item.key, "OK")}
                />
                OK
              </label>

              <label>
                <input
                  type="radio"
                  name={`status-${item.key}`}
                  value="FAIL"
                  checked={item.status === "FAIL"}
                  onChange={() => handleItemStatusChange(item.key, "FAIL")}
                />
                FAIL
              </label>
            </div>
          ))}
        </div>
      </div>
      <label htmlFor="notes">Notes (optional)</label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 300))}
        placeholder="Enter any additional notes..."
        rows={4}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Check"}
      </button>
      setNotes("");
    </form>
  );
}
