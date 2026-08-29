import type { ReactNode } from 'react'

interface Topic {
  question: string
  tone?: 'warning' | 'evidence'
  answer: ReactNode
}

function Source({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

const TOPICS: Topic[] = [
  {
    question: 'Co to jest akcja?',
    answer: (
      <>
        <p>
          Akcja to kawałek firmy. Kupujesz jedną akcję Apple i naprawdę stajesz się
          współwłaścicielem tej firmy – po prostu bardzo, bardzo małym.
        </p>
        <p>
          Kiedy firmie idzie dobrze i zarabia coraz więcej, chętnych na jej akcje przybywa, więc
          cena rośnie. Kiedy idzie źle, cena spada. Pojedyncza firma może też zbankrutować i
          wtedy zostajesz z niczym.
        </p>
      </>
    ),
  },
  {
    question: 'Co to jest ETF?',
    answer: (
      <>
        <p>
          Skoro jedna firma może paść, rozsądniej jest mieć akcje wielu firm naraz. Kupowanie
          pięciuset spółek po kolei byłoby jednak drogie i męczące.
        </p>
        <p>
          ETF to gotowy koszyk, w którym ktoś już te akcje poukładał. Kupujesz jeden udział w
          całym koszyku – tak samo prosto jak jedną akcję. Jeśli któraś firma z koszyka
          zbankrutuje, reszta to amortyzuje, a Ty nie musisz zgadywać, która spółka wygra, bo
          masz wszystkie.
        </p>
      </>
    ),
  },
  {
    question: 'Czym konkretnie jest Vanguard S&P 500?',
    answer: (
      <>
        <p>
          S&amp;P 500 to lista 500 największych spółek giełdowych w USA: Apple, Microsoft,
          Nvidia, Amazon i 496 kolejnych. Ten ETF nie próbuje być sprytniejszy od rynku – po
          prostu kupuje je wszystkie w odpowiednich proporcjach. Kiedy któraś firma podupada i
          wypada z listy, zostaje automatycznie zastąpiona nową, a Ty nie robisz nic.
        </p>
        <p>
          Ponieważ nikt tu niczego nie wymyśla, fundusz jest tani: opłata za zarządzanie to 0,07%
          rocznie, czyli 70 groszy od każdego 1000 zł. Vanguard to firma, która ten koszyk
          prowadzi.
        </p>
      </>
    ),
  },
  {
    question: 'Gdzie jest haczyk?',
    tone: 'warning',
    answer: (
      <>
        <p>
          Wykres wyżej rysuje równiutką krzywą, bo zakłada ten sam zwrot każdego roku. Prawdziwy
          rynek tak nie wygląda: w 2022 ten ETF stracił ponad 18%, a w 2008 rynek spadł o około
          37% i odrabiał to latami. Zdarzy Ci się otworzyć aplikację i zobaczyć mniej, niż
          wpłaciłeś – to normalne.
        </p>
        <p>
          Dlatego wkładaj tu tylko pieniądze, których nie będziesz musiał nagle wyjąć. Pamiętaj
          też, że fundusz jest wyceniany w dolarach, więc kurs USD/PLN rusza wynikiem, a od zysku
          przy sprzedaży zapłacisz 19% podatku Belki.
        </p>
      </>
    ),
  },
  {
    question: 'A co na to badania?',
    tone: 'evidence',
    answer: (
      <>
        <p>
          Te spadki nie przekreślają sensu inwestowania i nie trzeba w to wierzyć na słowo.
          Najdłuższe badanie rynków, jakie istnieje, to{' '}
          <Source href="https://www.jbs.cam.ac.uk/centres/ceam/research/investing-over-the-long-term/global-investment-returns/">
            Global Investment Returns Yearbook
          </Source>{' '}
          – Dimson, Marsh i Staunton zebrali w nim 126 lat notowań z 35 krajów. We wszystkich 21
          krajach z nieprzerwaną historią od 1900 roku akcje wypadły lepiej niż obligacje, lokaty
          i inflacja.
        </p>
        <p>
          Amerykańskie akcje dały przez te 126 lat{' '}
          <Source href="https://www.ubs.com/content/dam/assets/wm/static/cio/documents/giry2026-summary-public.pdf">
            9,8% rocznie nominalnie i 6,6% rocznie po odliczeniu inflacji
          </Source>
          . Jeden dolar z 1900 roku urósł do 124 854 dolarów, a licząc realną siłą nabywczą – do
          3 296 dolarów. Stąd bierze się domyślne 7% w tym kalkulatorze.
        </p>
        <p>
          Uczciwie do końca: „w długim okresie” nie znaczy „zawsze”. Od 1871 roku żadne 20 lat nie
          przyniosło straty nominalnie, ale{' '}
          <Source href="https://cmtassociation.org/wp-content/uploads/2026/03/Navigating_Lost_Decades_Final_revised.pdf">
            po uwzględnieniu inflacji 3% dwudziestoletnich okresów wyszło pod kreską
          </Source>
          , a 16% dało mniej niż 3% rocznie. Im dłużej trzymasz, tym lepsze masz szanse – ale to
          są szanse, nie obietnica.
        </p>
      </>
    ),
  },
]

export function Explainer() {
  return (
    <div className="explainer">
      {TOPICS.map((topic, index) => (
        <article
          className={`explainer__item${topic.tone ? ` explainer__item--${topic.tone}` : ''}`}
          key={topic.question}
        >
          <span className="explainer__number" aria-hidden="true">
            {topic.tone === 'warning' ? '!' : topic.tone === 'evidence' ? '✓' : index + 1}
          </span>
          <div className="explainer__body">
            <h3 className="explainer__question">{topic.question}</h3>
            {topic.answer}
          </div>
        </article>
      ))}
    </div>
  )
}
