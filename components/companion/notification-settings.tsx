'use client';

import { useState, useTransition } from 'react';
import { upsertNotificationPreferences } from '@/app/actions/notifications';
import type { NotificationPreferences } from '@/app/actions/notifications';

interface NotificationSettingsProps {
  initialPrefs: NotificationPreferences | null;
}

function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(initialPrefs?.reminders_enabled ?? false);
  const [time, setTime] = useState(initialPrefs?.reminder_time?.slice(0, 5) ?? '08:00');
  const [timezone, setTimezone] = useState(
    initialPrefs?.timezone ?? detectBrowserTimezone()
  );
  const [tzError, setTzError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(overrides?: Partial<{ reminders_enabled: boolean; reminder_time: string; timezone: string }>) {
    const tzToSave = overrides?.timezone ?? timezone;
    if (!isValidIANATimezone(tzToSave)) {
      setTzError(`"${tzToSave}" isn't a valid timezone. Try America/Chicago or Europe/London.`);
      return;
    }
    setTzError(null);
    setSaveError(null);
    startTransition(async () => {
      const result = await upsertNotificationPreferences({
        reminders_enabled: overrides?.reminders_enabled ?? enabled,
        reminder_time: overrides?.reminder_time ?? time,
        timezone: tzToSave,
      });
      if (result.success) {
        setSavedAt(new Date());
      } else {
        setSaveError(result.error ?? 'Could not save preferences.');
      }
    });
  }

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    save({ reminders_enabled: next });
  }

  function handleDetectTimezone() {
    const detected = detectBrowserTimezone();
    setTimezone(detected);
    setTzError(null);
    save({ timezone: detected });
  }

  return (
    <div style={{ maxWidth: 480 }}>

      {/* Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px',
        borderRadius: 12,
        border: '1px solid var(--faint)',
        background: 'var(--bg1)',
        marginBottom: 16,
        gap: 16,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--cream)', fontWeight: 500 }}>
            Daily reminder
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--stone)', lineHeight: 1.5 }}>
            A quiet prompt when your reading for the day is still open.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={enabled}
          aria-label={enabled ? 'Disable daily reminder' : 'Enable daily reminder'}
          style={{
            minWidth: 48,
            minHeight: 28,
            borderRadius: 14,
            border: 'none',
            background: enabled ? 'var(--companion)' : 'var(--faint)',
            cursor: isPending ? 'default' : 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>

      {/* Time + Timezone — only when enabled */}
      {enabled && (
        <div style={{
          padding: '18px 20px',
          borderRadius: 12,
          border: '1px solid var(--faint)',
          background: 'var(--bg1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 16,
        }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--stone)', display: 'block', marginBottom: 6 }}>
              Reminder time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => save()}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--faint)',
                borderRadius: 8,
                color: 'var(--cream)',
                fontSize: 14,
                padding: '8px 12px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--stone)' }}>
                Timezone
              </label>
              <button
                type="button"
                onClick={handleDetectTimezone}
                disabled={isPending}
                style={{
                  fontSize: 11,
                  color: 'var(--companion)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: 0.8,
                }}
              >
                Detect →
              </button>
            </div>
            <input
              type="text"
              value={timezone}
              onChange={(e) => { setTimezone(e.target.value); setTzError(null); }}
              onBlur={() => save()}
              placeholder="America/New_York"
              style={{
                background: 'var(--bg2)',
                border: `1px solid ${tzError ? 'rgba(200,80,80,0.5)' : 'var(--faint)'}`,
                borderRadius: 8,
                color: 'var(--cream)',
                fontSize: 14,
                padding: '8px 12px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            {tzError ? (
              <p style={{ margin: '5px 0 0', fontSize: 11, color: 'rgba(200,80,80,0.9)', lineHeight: 1.4 }}>
                {tzError}
              </p>
            ) : (
              <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--stone)', opacity: 0.55 }}>
                IANA name — e.g. America/Chicago, Europe/London, Asia/Tokyo.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status */}
      {saveError && (
        <p style={{ fontSize: 12, color: 'rgba(200,80,80,0.9)', margin: '4px 0 0', lineHeight: 1.4 }}>{saveError}</p>
      )}
      {savedAt && !saveError && !tzError && (
        <p style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5, margin: '4px 0 0' }}>
          Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

    </div>
  );
}
