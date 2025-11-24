import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileSelector from '../components/FileSelector'
import { fileService } from '../services/api'

function LandingPage() {
  const navigate = useNavigate()
  const [filesLoaded, setFilesLoaded] = useState(false)

  const handleFilesLoaded = async () => {
    // Validate files are loaded
    try {
      const openValidation = await fileService.validateFile('open')
      const releaseValidation = await fileService.validateFile('release')
      
      if (openValidation.data.exists && releaseValidation.data.exists) {
        setFilesLoaded(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      }
    } catch (err) {
      console.error('Validation error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Visualize Dashboard
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Upload or select Excel files to create interactive dashboards
        </p>
        <FileSelector onFilesLoaded={handleFilesLoaded} />
        {filesLoaded && (
          <div className="mt-4 text-center text-green-600 font-semibold">
            Files loaded successfully! Redirecting to dashboard...
          </div>
        )}
      </div>
    </div>
  )
}

export default LandingPage

