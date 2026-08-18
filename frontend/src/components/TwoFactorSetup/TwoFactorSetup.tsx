import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { disableTwoFactor, enableTwoFactor, regenerateRecoveryCodes, setupTwoFactor } from "../../profile/api";
import "./TwoFactorSetup.css";

export function TwoFactorSetup() {
  const { user, setUser } = useAuth();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const setupQuery = useQuery({
    queryKey: ["2fa-setup"],
    queryFn: setupTwoFactor,
    enabled: isSettingUp,
  });

  useEffect(() => {
    if (setupQuery.data) {
      QRCode.toDataURL(setupQuery.data.authenticatorUri).then(setQrDataUrl);
    }
  }, [setupQuery.data]);

  const enableMutation = useMutation({
    mutationFn: enableTwoFactor,
    onSuccess: (data) => {
      if (user) setUser({ ...user, twoFactorEnabled: true });
      setIsSettingUp(false);
      setCode("");
      setError(null);
      setRecoveryCodes(data.recoveryCodes);
    },
    onError: () => setError("Invalid code. Please try again."),
  });

  const disableMutation = useMutation({
    mutationFn: disableTwoFactor,
    onSuccess: () => {
      if (user) setUser({ ...user, twoFactorEnabled: false });
      setCode("");
      setError(null);
    },
    onError: () => setError("Invalid code. Please try again."),
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateRecoveryCodes,
    onSuccess: (data) => {
      setCode("");
      setError(null);
      setRecoveryCodes(data.recoveryCodes);
    },
    onError: () => setError("Invalid code. Please try again."),
  });

  function handleEnableSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");
    if (!cleanCode) return;
    enableMutation.mutate(cleanCode);
  }

  function handleDisableSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");
    if (!cleanCode) return;
    disableMutation.mutate(cleanCode);
  }

  function handleRegenerateSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");
    if (!cleanCode) return;
    regenerateMutation.mutate(cleanCode);
  }

  if (recoveryCodes) {
    return (
      <div className="two-factor-setup">
        <div className="two-factor-setup__title">Save your recovery codes</div>
        <p className="two-factor-setup__hint">
          Each code can be used once to log in if you lose access to your authenticator app. Save them somewhere
          safe — they won't be shown again.
        </p>
        <div className="two-factor-setup__recovery-codes">
          {recoveryCodes.map((c) => (
            <code key={c}>{c}</code>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={() => setRecoveryCodes(null)}>
          I've saved these codes
        </button>
      </div>
    );
  }

  if (user?.twoFactorEnabled) {
    return (
      <div className="two-factor-setup">
        <div className="two-factor-setup__title">Two-factor authentication</div>
        <p className="two-factor-setup__status two-factor-setup__status--enabled">Enabled</p>

        <form className="two-factor-setup__form" onSubmit={handleDisableSubmit}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter code to disable"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <div className="two-factor-setup__actions">
            <button type="submit" className="btn-secondary" disabled={disableMutation.isPending}>
              {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={regenerateMutation.isPending}
              onClick={handleRegenerateSubmit}
            >
              {regenerateMutation.isPending ? "Generating..." : "Regenerate recovery codes"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="two-factor-setup">
      <div className="two-factor-setup__title">Two-factor authentication</div>
      <p className="two-factor-setup__status">Not enabled</p>

      {!isSettingUp ? (
        <button type="button" className="btn-secondary" onClick={() => setIsSettingUp(true)}>
          Set up 2FA
        </button>
      ) : (
        <>
          {qrDataUrl && <img className="two-factor-setup__qr" src={qrDataUrl} alt="Scan with Google Authenticator" />}
          <p className="two-factor-setup__hint">
            Scan with Google Authenticator, or enter this key manually:
          </p>
          {setupQuery.data && <code className="two-factor-setup__key">{setupQuery.data.sharedKey}</code>}

          <form className="two-factor-setup__form" onSubmit={handleEnableSubmit}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <div className="two-factor-setup__actions">
              <button type="submit" className="btn-primary" disabled={enableMutation.isPending}>
                {enableMutation.isPending ? "Enabling..." : "Enable"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsSettingUp(false)}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
