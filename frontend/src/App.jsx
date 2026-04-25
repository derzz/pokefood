import { useEffect, useState } from 'react'
import {
  createPokefoodFromImage,
  loadUserPokefoods,
  saveUserPokefoods,
} from './api'
import './App.css'

function App() {
  const [bucket, setBucket] = useState('pokefood-images')
  const [objectPath, setObjectPath] = useState('')
  const [pokefoods, setPokefoods] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setPokefoods(loadUserPokefoods())
  }, [])

  const handleCreatePokefood = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    const normalizedBucket = bucket.trim()
    const normalizedObjectPath = objectPath.trim()

    if (!normalizedBucket || !normalizedObjectPath) {
      setErrorMessage('Bucket and object path are required.')
      return
    }

    try {
      setIsCreating(true)
      const created = await createPokefoodFromImage({
        bucket: normalizedBucket,
        objectPath: normalizedObjectPath,
      })

      setPokefoods((prev) => {
        const updated = [created, ...prev]
        saveUserPokefoods(updated)
        return updated
      })

      setObjectPath('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Create failed')
    } finally {
      setIsCreating(false)
    }
  }

  const handleResetCollection = () => {
    setPokefoods([])
    saveUserPokefoods([])
  }

  return (
    <>
      <section id="center">
        <div className="intro">
          <h1>Pokefood Creator</h1>
          <p>Create pokefoods from your backend CV pipeline and keep a local collection.</p>
        </div>

        <form className="create-form" onSubmit={handleCreatePokefood}>
          <label>
            GCP Bucket
            <input
              type="text"
              value={bucket}
              onChange={(event) => setBucket(event.target.value)}
              placeholder="pokefood-images"
              disabled={isCreating}
            />
          </label>

          <label>
            Object Path
            <input
              type="text"
              value={objectPath}
              onChange={(event) => setObjectPath(event.target.value)}
              placeholder="uploads/bento_001.jpg"
              disabled={isCreating}
            />
          </label>

          <button type="submit" className="primary" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Pokefood'}
          </button>
        </form>

        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <div className="collection-header">
            <h2>Your Pokefoods</h2>
            <button type="button" className="ghost" onClick={handleResetCollection}>
              Clear
            </button>
          </div>

          {pokefoods.length === 0 ? (
            <p className="empty">No pokefoods yet. Create one from an image object path.</p>
          ) : (
            <ul className="cards">
              {pokefoods.map((pokefood) => (
                <li key={pokefood.id} className="card">
                  <img src={pokefood.imageUrl} alt={pokefood.personalName} loading="lazy" />
                  <div>
                    <h3>{pokefood.personalName}</h3>
                    <p>
                      {pokefood.name} | {pokefood.type} | HP {pokefood.hp}
                    </p>
                    <p className="labels">{pokefood.labels.join(', ')}</p>
                    <p className="moves">
                      {pokefood.moves.map((move) => `${move.name} (${move.damage})`).join(' | ')}
                    </p>
                    {typeof pokefood.sourceConfidence === 'number' ? (
                      <p className="confidence">
                        Confidence: {(pokefood.sourceConfidence * 100).toFixed(1)}%
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
