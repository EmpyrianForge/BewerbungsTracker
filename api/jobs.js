export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const params = new URLSearchParams(req.query)
    const baUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params.toString()}`

    const response = await fetch(baUrl, {
      headers: {
        'X-API-Key': 'jobboerse-jobsuche',
        'User-Agent': 'Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; iOS 15.1.0) Alamofire/5.4.4',
      },
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch {
    res.status(500).json({ error: 'Verbindung zur BA-API fehlgeschlagen.' })
  }
}
