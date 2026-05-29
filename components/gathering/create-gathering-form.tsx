import { createGathering } from '@/app/actions/gatherings';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--faint2)',
  background: 'var(--ink)',
  color: 'var(--cream)',
  fontSize: 15,
  lineHeight: 1.5,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: 'var(--muted)',
  marginBottom: 6,
};

export default function CreateGatheringForm() {
  return (
    <form action={createGathering} style={{ display: 'grid', gap: 24 }}>

      <div>
        <label htmlFor="name" style={labelStyle}>Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={3}
          maxLength={80}
          placeholder="e.g. Women Reading Romans"
          style={inputStyle}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="description" style={labelStyle}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="What will this gathering focus on?"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div>
        <label htmlFor="passage_ref" style={labelStyle}>Passage or theme (optional)</label>
        <input
          id="passage_ref"
          name="passage_ref"
          type="text"
          maxLength={100}
          placeholder="e.g. Romans 8, Psalms, Sermon on the Mount"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="visibility" style={labelStyle}>Visibility</label>
        <select
          id="visibility"
          name="visibility"
          defaultValue="community"
          style={inputStyle}
        >
          <option value="public">Public — visible to everyone</option>
          <option value="community">Community — visible to signed-in members</option>
          <option value="private">Private — invite only</option>
        </select>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--stone)' }}>
          Community is recommended for most new gatherings.
        </p>
      </div>

      <button
        type="submit"
        style={{
          justifySelf: 'start',
          minHeight: 44,
          padding: '0 1.5rem',
          borderRadius: 999,
          border: 'none',
          background: 'var(--gold)',
          color: 'var(--ink)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Create gathering
      </button>

    </form>
  );
}
