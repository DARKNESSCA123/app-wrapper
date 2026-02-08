'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import QRCode from 'react-qr-code'

// App information data structure (easy to replace later)
const appInfo = {
  name: 'NEW88',
  developer: 'OKVIP ALIANCE',
  rating: 4.9,
  reviews: 6900,
  downloads: '3.2M+',
  ageRating: '18+',
  description: `Đăng ký tài khoản ngay hôm nay và nhận ngay 58K cược miễn phí! Số tiền này sẽ được rút về tài khoản ngân hàng của bạn một cách dễ dàng.

Đừng bỏ lỡ cơ hội này! Hãy nhanh tay đăng ký và mời bạn bè cùng tham gia để nhận thêm nhiều phần thưởng hấp dẫn nhé!

Trải nghiệm chơi game ngay tại nhà, nơi mỗi trận đấu đều khiến chiến thắng của bạn vươn lên tầm cao mới. Càng chơi nhiều, càng thắng lớn.

Nhưng chiến thắng cuối cùng chưa chắc thuộc về bạn.`,
  categories: ['Game', 'Tools'],
  starDistribution: {
    5: 85,
    4: 10,
    3: 3,
    2: 1,
    1: 1,
  },
}

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already installable (for browsers that support it)
    if (!iOS && 'serviceWorker' in navigator) {
      // Small delay to check if prompt will appear
      setTimeout(() => {
        if (!deferredPrompt) {
          // Check if we can determine installability
          setCanInstall(true)
        }
      }, 1000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true)
      return
    }

    if (deferredPrompt) {
      setIsInstalling(true)
      try {
        // Trigger install prompt immediately
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        setDeferredPrompt(null)
        setCanInstall(false)
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt')
          // App will install automatically after user accepts
        } else {
          console.log('User dismissed the install prompt')
        }
      } catch (error) {
        console.error('Error showing install prompt:', error)
        // Fallback instructions
        showFallbackInstructions()
      } finally {
        setIsInstalling(false)
      }
    } else {
      // No deferred prompt available - show instructions
      showFallbackInstructions()
    }
  }

  const showFallbackInstructions = () => {
    const instructions = 
      'Vui lòng sử dụng menu trình duyệt để cài đặt:\n\n' +
      '• Chrome/Edge: Menu (⋮) > Cài đặt ứng dụng\n' +
      '• Firefox: Menu (☰) > Cài đặt\n' +
      '• Safari: Chia sẻ > Thêm vào Màn hình chính\n\n' +
      'Hoặc tìm biểu tượng cài đặt trên thanh địa chỉ trình duyệt.'
    
    alert(instructions)
  }

  if (isStandalone) {
    return (
      <div className="w-full bg-green-500/20 border border-green-500 rounded-lg p-4 text-center">
        <p className="text-green-400 font-semibold">✓ Ứng dụng đã được cài đặt</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50"
      >
        {isInstalling ? (
          <>
            <svg
              className="animate-spin h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Đang cài đặt...
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {isIOS ? 'Hướng dẫn cài đặt' : canInstall ? 'Cài đặt ngay' : 'Cài đặt ứng dụng'}
          </>
        )}
      </button>
      {!isIOS && canInstall && !isInstalling && (
        <p className="text-center text-xs text-gray-400 mt-2">
          Nhấn để cài đặt ứng dụng vào thiết bị của bạn
        </p>
      )}
      {showIOSInstructions && (
        <div className="mt-4 bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold">Hướng dẫn cài đặt trên iOS</h3>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Nhấn vào nút chia sẻ <span className="inline-block mx-1">⎋</span> ở thanh dưới cùng</li>
            <li>Cuộn xuống và chọn "Thêm vào Màn hình chính" <span className="inline-block mx-1">➕</span></li>
            <li>Nhấn "Thêm" để hoàn tất</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    // Check if app is running in standalone mode (installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      // Redirect to Google.com when app is opened in standalone mode
      // Use replace to avoid adding to browser history
      window.location.replace('https://google.com')
      return
    }

    // Only set URL if not in standalone mode
    setCurrentUrl(window.location.href)
  }, [])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: appInfo.name,
          text: `Tải ứng dụng ${appInfo.name} ngay hôm nay!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Đã sao chép link vào clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* App Icon */}
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
              <Image
                src="/brand-logo.png"
                alt={appInfo.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* App Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{appInfo.name}</h1>
              <svg
                className="w-6 h-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <p className="text-gray-400 mb-4">{appInfo.developer}</p>

            {/* Play Protect Badge */}
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-300">
                Được xác minh bởi Play Protect
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <div className="text-2xl font-bold">{appInfo.rating}</div>
                <div className="text-sm text-gray-400">
                  {appInfo.reviews.toLocaleString()} bài đánh giá
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{appInfo.downloads}</div>
                <div className="text-sm text-gray-400">Lượt tải xuống</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{appInfo.ageRating}</div>
                <div className="text-sm text-gray-400">Tất cả mọi người</div>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            {/* QR Code Visualization */}
            <div className="flex-1 flex items-center justify-center gap-4">
              <div className="relative">
                <div className="w-24 h-40 bg-gray-800 rounded-lg p-2 flex items-center justify-center">
                  {currentUrl && (
                    <QRCode
                      value={currentUrl}
                      size={80}
                      bgColor="#1a1a1a"
                      fgColor="#ffffff"
                    />
                  )}
                </div>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>

              <div className="flex flex-col items-center">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <div className="w-1 h-12 bg-green-500"></div>
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>

              <div className="relative">
                <div className="w-48 h-48 bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                  {currentUrl && (
                    <QRCode
                      value={currentUrl}
                      size={200}
                      bgColor="#1a1a1a"
                      fgColor="#ffffff"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Phone with Install Button */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-56 bg-gray-800 rounded-lg p-3 mb-2">
                <div className="w-full h-full bg-[#0a0a0a] rounded flex flex-col items-center justify-center p-2">
                  <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm mb-2">
                    {appInfo.name}
                  </div>
                  <div className="text-xs text-center mb-2">{appInfo.name}</div>
                  <button className="w-full bg-green-500 text-white text-xs py-1 px-2 rounded">
                    Cài đặt nhanh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 mb-4">
            Quét mã QR để cài đặt
          </p>

          {/* Install Button */}
          <InstallButton />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleShare}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Chia sẻ
          </button>
          <button className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Thêm vào danh sách yêu thích
          </button>
        </div>

        {/* Promotional Images Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">
              HỘI VIÊN MỚI NẠP ĐẦU 50K THƯỞNG LÊN ĐẾN 18.888K
            </h3>
            <div className="w-full h-48 bg-yellow-700 rounded flex items-center justify-center">
              <span className="text-4xl">🎁</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">
              NGÀY 6-11-21 HÀNG THÁNG TRI ÂN HỘI VIÊN 7.000 TỶ
            </h3>
            <div className="w-full h-48 bg-yellow-700 rounded flex items-center justify-center">
              <span className="text-4xl">💰</span>
            </div>
          </div>
        </div>

        {/* App Information Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Thông tin về ứng dụng này</h2>
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <p className="text-gray-300 whitespace-pre-line mb-4">
              {appInfo.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {appInfo.categories.map((category) => (
                <span
                  key={category}
                  className="bg-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ratings and Reviews Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Xếp hạng và đánh giá</h2>
          <p className="text-sm text-gray-400 mb-6">
            Điểm xếp hạng và bài đánh giá đã được xác minh
          </p>
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Overall Rating */}
              <div className="shrink-0 text-center md:text-left">
                <div className="text-6xl font-bold mb-2">{appInfo.rating}</div>
                <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-6 h-6 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  {appInfo.reviews.toLocaleString()} đánh giá
                </div>
              </div>

              {/* Star Breakdown */}
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3 mb-2">
                    <span className="text-sm w-8">{stars}</span>
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 relative overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${appInfo.starDistribution[stars as keyof typeof appInfo.starDistribution]}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {appInfo.starDistribution[stars as keyof typeof appInfo.starDistribution]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
