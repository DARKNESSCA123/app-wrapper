'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import QRCode from 'react-qr-code'
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

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

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('Xin chào! Đây là thông báo test từ ứng dụng.')
  const [browserInfo, setBrowserInfo] = useState<{ name: string; isIOS: boolean; isSafari: boolean } | null>(null)

  useEffect(() => {
    // Detect browser and platform
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
    const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent)
    const isEdge = /Edg/.test(userAgent)
    const isFirefox = /Firefox/.test(userAgent)
    
    // On iOS, all browsers use WebKit engine and don't support Web Push API
    // This includes Chrome, Edge, Firefox, Safari - all are limited by iOS WebKit
    let browserName = 'Other'
    if (isIOS) {
      if (isSafari) browserName = 'Safari (iOS)'
      else if (isChrome) browserName = 'Chrome (iOS)'
      else if (isEdge) browserName = 'Edge (iOS)'
      else if (isFirefox) browserName = 'Firefox (iOS)'
      else browserName = 'Browser (iOS)'
    } else {
      if (isSafari) browserName = 'Safari (macOS)'
      else if (isChrome) browserName = 'Chrome'
      else if (isEdge) browserName = 'Edge'
      else if (isFirefox) browserName = 'Firefox'
    }
    
    setBrowserInfo({
      name: browserName,
      isIOS,
      isSafari: !!isSafari
    })

    // Check support
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasPushManager = 'PushManager' in window
    
    // Important: On iOS, ALL browsers (Chrome, Edge, Firefox, Safari) use WebKit
    // and do NOT support Web Push API due to iOS restrictions
    // Only Safari on macOS 16+ supports Web Push API
    if (hasServiceWorker && hasPushManager && !isIOS) {
      setIsSupported(true)
      checkSubscription()
    } else if (isIOS) {
      // All iOS browsers don't support Web Push API
      setIsSupported(false)
    }
  }, [])

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  async function subscribeToPush() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      alert('VAPID key chưa được cấu hình. Vui lòng kiểm tra biến môi trường NEXT_PUBLIC_VAPID_PUBLIC_KEY')
      return
    }

    setIsSubscribing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        alert('Bạn cần cho phép thông báo để sử dụng tính năng này.')
        setIsSubscribing(false)
        return
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      
      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
      alert('Đã đăng ký nhận thông báo thành công!')
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Lỗi khi đăng ký thông báo: ' + (error as Error).message)
    } finally {
      setIsSubscribing(false)
    }
  }

  async function unsubscribeFromPush() {
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
        alert('Đã hủy đăng ký thông báo thành công!')
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('Lỗi khi hủy đăng ký thông báo')
    }
  }

  async function sendTestNotification() {
    if (!subscription) {
      alert('Vui lòng đăng ký nhận thông báo trước!')
      return
    }

    setIsSending(true)
    try {
      await sendNotification(notificationMessage || 'Test notification')
      alert('Đã gửi thông báo test thành công!')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Lỗi khi gửi thông báo: ' + (error as Error).message)
    } finally {
      setIsSending(false)
    }
  }

  if (!isSupported) {
    const isIOSDevice = browserInfo?.isIOS
    
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Push Notifications v2
        </h3>
        
        {isIOSDevice ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-yellow-400 font-semibold mb-2">
                  Tất cả trình duyệt trên iOS không hỗ trợ Web Push Notifications
                </p>
                <p className="text-gray-400 text-sm mb-3">
                  Trên iOS, Apple yêu cầu tất cả trình duyệt (bao gồm Chrome, Edge, Firefox, Safari) phải sử dụng WebKit engine. 
                  WebKit trên iOS <strong>không hỗ trợ Web Push API</strong> do hạn chế của hệ điều hành.
                </p>
                <div className="bg-[#0a0a0a] rounded p-3 mb-3">
                  <p className="text-gray-300 text-sm font-medium mb-2">Trình duyệt hiện tại: <span className="text-yellow-400">{browserInfo?.name}</span></p>
                  <p className="text-gray-400 text-xs">
                    Ngay cả Chrome, Edge, Firefox trên iOS cũng không hỗ trợ Web Push API vì chúng đều chạy trên WebKit.
                  </p>
                </div>
                <div className="text-gray-400 text-sm">
                  <p className="font-medium mb-2 text-gray-300">Giải pháp thay thế:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Sử dụng Safari trên macOS (phiên bản 16 trở lên) - hỗ trợ đầy đủ</li>
                    <li>Sử dụng Chrome/Edge/Firefox trên Android hoặc Desktop</li>
                    <li>Cài đặt ứng dụng PWA và sử dụng native notifications (nếu có)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Trình duyệt của bạn không hỗ trợ Push Notifications.
            </p>
            <div className="text-sm text-gray-500">
              <p className="mb-2">Push Notifications được hỗ trợ trên:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Chrome (Desktop & Android)</li>
                <li>Edge (Desktop & Android)</li>
                <li>Firefox (Desktop & Android)</li>
                <li>Safari trên macOS (từ phiên bản 16+)</li>
              </ul>
              <p className="mt-3 text-yellow-400 text-xs">
                ⚠️ Lưu ý: Tất cả trình duyệt trên iOS (bao gồm Chrome, Edge, Firefox) đều không hỗ trợ Web Push API.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Push Notifications
      </h3>
      
      {subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Đã đăng ký nhận thông báo</span>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Nội dung thông báo test:
            </label>
            <input
              type="text"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              className="w-full bg-[#0a0a0a] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={sendTestNotification}
              disabled={isSending}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Gửi Test Notification
                </>
              )}
            </button>
            
            <button
              onClick={unsubscribeFromPush}
              className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Hủy đăng ký
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Đăng ký để nhận thông báo đẩy từ ứng dụng.
          </p>
          <button
            onClick={subscribeToPush}
            disabled={isSubscribing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubscribing ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang đăng ký...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Đăng ký nhận thông báo
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
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
    // const isStandalone = 
    //   window.matchMedia('(display-mode: standalone)').matches ||
    //   (window.navigator as any).standalone === true ||
    //   document.referrer.includes('android-app://')

    // if (isStandalone) {
    //   // Redirect to Google.com when app is opened in standalone mode
    //   // Use replace to avoid adding to browser history
    //   window.location.replace('https://google.com')
    //   return
    // }

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

        {/* Push Notification Section */}
        <div className="mb-8">
          <PushNotificationManager />
        </div>
      </div>
    </div>
  )
}
