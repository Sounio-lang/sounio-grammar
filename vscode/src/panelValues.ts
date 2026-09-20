// Presentation validation only; no inference or uncertainty propagation.
export function escapeHtml(value: unknown): string {
    return String(value ?? 'Unavailable').replace(/[&<>"']/g, c =>
        ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
}
export function finiteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
export function confidenceValue(value: unknown): number | undefined {
    return finiteNumber(value) && value >= 0 && value <= 1 ? value : undefined;
}
export function hasUncertainty(value: any): boolean {
    return value != null && finiteNumber(value.mean) && finiteNumber(value.std) && value.std >= 0;
}
