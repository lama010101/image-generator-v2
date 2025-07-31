import React, { useState } from "react";

interface EditableImageMetadataProps {
  image: Record<string, any>;
  onSave: (newData: Record<string, any>) => Promise<void>;
}

export const EditableImageMetadata: React.FC<EditableImageMetadataProps> = ({ image, onSave }) => {
  const [form, setForm] = useState<Record<string, any>>({ ...image });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSave(form);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 p-3 border rounded bg-muted/40">
      <div className="font-medium mb-2">Image (ID: {image.id})</div>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-2"
      >
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(form).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="font-semibold text-muted-foreground">{key}</dt>
              <dd>
                <input
                  className="w-full px-1 py-0.5 rounded border border-border bg-background text-foreground text-xs"
                  value={typeof value === "object" && value !== null ? JSON.stringify(value) : value ?? ""}
                  onChange={e => handleChange(key, e.target.value)}
                  disabled={key === "id"}
                  name={key}
                  type="text"
                />
              </dd>
            </React.Fragment>
          ))}
        </dl>
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {success && <span className="text-green-600 text-xs">Saved!</span>}
          {error && <span className="text-destructive text-xs">{error}</span>}
        </div>
      </form>
    </div>
  );
};

export default EditableImageMetadata;
