import type { ReactNode } from 'react'

interface Topic {
  question: string
  warning?: boolean
  answer: ReactNode
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
    warning: true,
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
]

export function Explainer() {
  return (
    <div className="explainer">
      {TOPICS.map((topic, index) => (
        <article
          className={`explainer__item${topic.warning ? ' explainer__item--warning' : ''}`}
          key={topic.question}
        >
          <span className="explainer__number" aria-hidden="true">
            {topic.warning ? '!' : index + 1}
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
