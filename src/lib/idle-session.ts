export type IdleCallbacks = { onWarn: () => void; onExpire: () => void; };
const MS_25_MIN = 25 * 60 * 1000;
const MS_2_MIN = 2 * 60 * 1000;

export function startIdleTimer(cb: IdleCallbacks) {
    let warnTimer: number, expireTimer: number;
    const reset = () => {
        window.clearTimeout(warnTimer);
        window.clearTimeout(expireTimer);
        warnTimer = window.setTimeout(cb.onWarn, MS_25_MIN);
        expireTimer = window.setTimeout(cb.onExpire, MS_25_MIN + MS_2_MIN);
    };
    ["click", "keydown", "scroll", "mousemove", "touchstart"].forEach(e =>
        window.addEventListener(e, reset, { passive: true })
    );
    reset();
    return () => {
        window.clearTimeout(warnTimer);
        window.clearTimeout(expireTimer);
    };
}

