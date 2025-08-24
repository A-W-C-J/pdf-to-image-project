import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import '@testing-library/jest-dom'
import Home from '../app/page'

// Mock messages for internationalization
const messages = {
  title: 'PDF to Image Converter',
  description: 'Convert PDF files to images',
  uploadFile: 'Upload PDF File',
  convertButton: 'Convert to Images',
  clearButton: 'Clear All',
  downloadAll: 'Download All Images',
  settings: 'Settings',
  scale: 'Scale',
  outputFormat: 'Output Format',
  mergePages: 'Merge Pages',
  addWatermark: 'Add Watermark',
  watermarkText: 'Watermark Text',
  watermarkPosition: 'Watermark Position',
  watermarkOpacity: 'Watermark Opacity',
  ocrLanguage: 'OCR Language',
  enableSummary: 'Enable Summary',
  summaryLanguage: 'Summary Language',
  summaryLength: 'Summary Length'
}

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => messages[key as keyof typeof messages] || key,
  useLocale: () => 'en'
}))

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: jest.fn(() => Promise.resolve({
        getViewport: jest.fn(() => ({ width: 100, height: 100 })),
        render: jest.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
  }))
}))

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  recognize: jest.fn(() => Promise.resolve({ data: { text: 'Mocked OCR text' } }))
}))

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('Home Page', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('renders the main heading', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/PDF to Image Converter/i)).toBeInTheDocument()
  })

  it('renders file upload area', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Upload PDF File/i)).toBeInTheDocument()
  })

  it('renders convert button', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Convert to Images/i)).toBeInTheDocument()
  })

  it('renders clear button', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Clear All/i)).toBeInTheDocument()
  })

  it('renders settings section', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Settings/i)).toBeInTheDocument()
  })

  it('renders scale input', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Scale/i)).toBeInTheDocument()
  })

  it('renders output format selector', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Output Format/i)).toBeInTheDocument()
  })

  it('renders merge pages checkbox', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Merge Pages/i)).toBeInTheDocument()
  })

  it('renders watermark checkbox', () => {
    renderWithIntl(<Home />)
    expect(screen.getByText(/Add Watermark/i)).toBeInTheDocument()
  })

  it('renders basic UI elements', () => {
    renderWithIntl(<Home />)
    
    // Check that the component renders without crashing
    expect(screen.getByText(/PDF to Image Converter/i)).toBeInTheDocument()
    expect(screen.getByText(/Upload PDF File/i)).toBeInTheDocument()
    expect(screen.getByText(/Settings/i)).toBeInTheDocument()
  })
})