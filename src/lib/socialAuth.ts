declare global {
  interface Window {
    google?: any
    FB?: any
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script ${src}`))
    document.body.appendChild(script)
  })
}

export async function getGoogleOAuthToken(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error('Google Client ID is not configured.')
  }

  await loadScript('https://accounts.google.com/gsi/client')

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id?.initialize || !window.google?.accounts?.id?.prompt) {
      reject(new Error('Google Identity Services không khả dụng.'))
      return
    }

    const callback = (response: { credential?: string; clientId?: string }) => {
      if (response?.credential) {
        resolve(response.credential)
      } else {
        reject(new Error('Không nhận được token từ Google.'))
      }
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback,
      ux_mode: 'popup',
    })

    window.google.accounts.id.prompt()
  })
}

export async function getFacebookOAuthToken(appId: string): Promise<string> {
  if (!appId) {
    throw new Error('Facebook App ID is not configured.')
  }

  await loadScript('https://connect.facebook.net/en_US/sdk.js')

  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK không khả dụng.'))
      return
    }

    window.FB.init({
      appId,
      cookie: true,
      xfbml: false,
      version: 'v17.0',
    })

    window.FB.login((response: any) => {
      if (response?.authResponse?.accessToken) {
        resolve(response.authResponse.accessToken)
      } else {
        reject(new Error('Không nhận được access token từ Facebook.'))
      }
    }, { scope: 'email' })
  })
}
