import { useState } from 'react'
import './ReveGenerator.css'
import { useReveGenerator } from '@/hooks/useReveGenerator'
import { saveReveImage } from '@/services/reveImageSaver'

const ASPECT_RATIOS = ['3:2', '16:9', '4:3', '1:1', '9:16', '2:3', '3:4'] as const
const VERSIONS = ['latest', 'reve-create@20250915'] as const

export function ReveGeneratorPage() {
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)

  const {
    form,
    setFormValue,
    generate,
    isLoading,
    error,
    result,
    history,
    copyFeedback,
    handlers: { selectHistory, removeHistory, clearHistory, copyBase64 },
    computed: { imageUrl, imageSizeKb, formatTimestamp },
  } = useReveGenerator()

  const handleSaveImage = async () => {
    if (!result) return

    setIsSavingImage(true)
    setSaveFeedback(null)

    try {
      const saveResult = await saveReveImage({
        imageBase64: result.image,
        prompt: result.payload?.prompt ?? form.prompt,
        aspectRatio: result.payload?.aspect_ratio ?? form.aspect_ratio,
        version: result.version,
        requestId: result.request_id,
        creditsUsed: result.credits_used,
        creditsRemaining: result.credits_remaining,
        title: result.payload?.prompt?.slice(0, 60) ?? form.prompt.slice(0, 60),
      })

      if (!saveResult.success) {
        throw new Error(saveResult.error ?? 'Unknown error')
      }

      setSaveFeedback('Image saved to gallery.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save image.'
      setSaveFeedback(message)
    } finally {
      setIsSavingImage(false)
      setTimeout(() => setSaveFeedback(null), 4000)
    }
  }

  return (
    <div className="reve-app">
      <header className="reve-app__header">
        <h1>REVE Image Generator</h1>
        <p>Generate images from text prompts using the REVE API.</p>
      </header>

      <main className="reve-app__content">
        <section className="reve-panel">
          <h2>Request</h2>
          <form
            className="reve-form"
            onSubmit={(event) => {
              event.preventDefault()
              generate()
            }}
          >
            <label className="reve-form__field">
              <span>Prompt</span>
              <textarea
                value={form.prompt}
                onChange={(event) => setFormValue('prompt', event.target.value)}
                placeholder="Describe the image you want to generate"
                maxLength={2560}
                rows={6}
                required
              />
              <small>{form.prompt.length} / 2560 characters</small>
            </label>

            <div className="reve-form__row">
              <label className="reve-form__field">
                <span>Aspect ratio</span>
                <select
                  value={form.aspect_ratio}
                  onChange={(event) => setFormValue('aspect_ratio', event.target.value)}
                >
                  {ASPECT_RATIOS.map((ratio) => (
                    <option key={ratio} value={ratio}>
                      {ratio}
                    </option>
                  ))}
                </select>
              </label>

              <label className="reve-form__field">
                <span>Version</span>
                <select
                  value={form.version}
                  onChange={(event) => setFormValue('version', event.target.value)}
                >
                  {VERSIONS.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button type="submit" className="reve-form__submit" disabled={isLoading}>
              {isLoading ? 'Generating…' : 'Generate image'}
            </button>

            {error && <p className="reve-form__error">{error}</p>}
          </form>
        </section>

        <section className="reve-panel">
          <h2>Response</h2>

          {!result && !error && <p>No image generated yet.</p>}

          {result && (
            <div className="reve-result">
              <div className="reve-result__meta">
                <div>
                  <strong>Request ID:</strong> {result.request_id || '—'}
                </div>
                <div>
                  <strong>HTTP status:</strong> {result.httpStatus}
                </div>
                <div>
                  <strong>Generated:</strong> {formatTimestamp(result.createdAt)}
                </div>
                <div>
                  <strong>Version:</strong> {result.version}
                </div>
                <div>
                  <strong>Content violation:</strong> {result.content_violation ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Credits used:</strong> {result.credits_used}
                </div>
                <div>
                  <strong>Credits remaining:</strong> {result.credits_remaining}
                </div>
                {imageSizeKb && (
                  <div>
                    <strong>Image size:</strong> {imageSizeKb} KB
                  </div>
                )}
                <div>
                  <strong>Base64 length:</strong> {result.image.length.toLocaleString()}
                </div>
              </div>

              {imageUrl && (
                <div className="reve-result__preview">
                  <img src={imageUrl} alt="Generated" />
                  <div className="reve-result__actions">
                    <a
                      className="reve-download"
                      href={imageUrl}
                      download={`reve-image-${result.request_id || 'preview'}.png`}
                    >
                      Download image
                    </a>
                    <button type="button" className="reve-secondary" onClick={copyBase64}>
                      Copy base64
                    </button>
                    <button
                      type="button"
                      className="reve-secondary"
                      disabled={isSavingImage}
                      onClick={handleSaveImage}
                    >
                      {isSavingImage ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  {(copyFeedback || saveFeedback) && (
                    <p className="reve-hint">
                      {saveFeedback ?? copyFeedback}
                    </p>
                  )}
                </div>
              )}

              <div className="reve-result__details">
                <div className="reve-result__section">
                  <h3>Request payload</h3>
                  <pre>{JSON.stringify(result.payload, null, 2)}</pre>
                </div>
                <div className="reve-result__section">
                  <h3>Response snapshot</h3>
                  <pre>
                    {JSON.stringify(
                      {
                        version: result.version,
                        content_violation: result.content_violation,
                        request_id: result.request_id,
                        credits_used: result.credits_used,
                        credits_remaining: result.credits_remaining,
                        image_preview: `${result.image.slice(0, 96)}…`,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="reve-history">
              <div className="reve-history__header">
                <h3>Saved locally</h3>
                <button type="button" className="reve-secondary" onClick={clearHistory}>
                  Clear history
                </button>
              </div>
              <div className="reve-history__list">
                {history.map((entry) => (
                  <article
                    key={entry.id}
                    className={`reve-history__item${result?.id === entry.id ? ' reve-history__item--active' : ''}`}
                  >
                    <header className="reve-history__meta">
                      <span>{formatTimestamp(entry.createdAt)}</span>
                      <span>{entry.payload.aspect_ratio}</span>
                      <span>{entry.payload.version}</span>
                      <span>{entry.request_id || '—'}</span>
                    </header>
                    <p className="reve-history__prompt">{entry.payload.prompt}</p>
                    <div className="reve-history__actions">
                      <button type="button" onClick={() => selectHistory(entry.id)}>
                        View
                      </button>
                      <button
                        type="button"
                        className="reve-secondary"
                        onClick={() => removeHistory(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
