export default function RequestError({ message, onRetry }) {
  return (
    <div className="card">
      <p className="error-text" style={{ margin: 0 }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="secondary" style={{ marginTop: 12 }} onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  )
}
