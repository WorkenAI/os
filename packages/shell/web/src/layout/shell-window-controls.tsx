'use client'

export function ShellWindowControls({
  onClose,
  onMinimize,
  onZoom,
  closeLabel = 'Close shell',
  minimizeLabel = 'Minimize shell',
  zoomLabel = 'Toggle shell',
}: {
  onClose?: () => void
  onMinimize?: () => void
  onZoom?: () => void
  closeLabel?: string
  minimizeLabel?: string
  zoomLabel?: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] transition-opacity hover:opacity-80"
        />
      ) : (
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      )}
      {onMinimize ? (
        <button
          type="button"
          onClick={onMinimize}
          aria-label={minimizeLabel}
          className="h-2.5 w-2.5 rounded-full bg-[#febc2e] transition-opacity hover:opacity-80"
        />
      ) : (
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      )}
      {onZoom ? (
        <button
          type="button"
          onClick={onZoom}
          aria-label={zoomLabel}
          className="h-2.5 w-2.5 rounded-full bg-[#28c840] transition-opacity hover:opacity-80"
        />
      ) : (
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      )}
    </div>
  )
}
