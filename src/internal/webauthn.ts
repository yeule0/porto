export function touchWellknown(parameters: touchWellknown.Parameters) {
  if (typeof window === 'undefined') return

  const { rpId } = parameters
  const origin = `${window.location.protocol}//${window.location.hostname}`
  const url = `https://${rpId}/.well-known/webauthn`
  fetch(url)
    .then((x) => x.json())
    .then((x) => {
      if (x.origins.includes(origin)) return
      fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({
          origin: `${window.location.protocol}//${window.location.hostname}`,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
}

export declare namespace touchWellknown {
  export type Parameters = {
    rpId: string
  }
}
