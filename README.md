# S&P 500 – ile urośnie Twoja inwestycja?

Kalkulator pokazujący, jak pozycja w **Vanguard S&P 500 UCITS ETF** kupiona 29 sierpnia 2026
rośnie przez 10, 20 i 50 lat przy zadanym zwrocie rocznym i comiesięcznych dopłatach.
Interfejs jest po polsku, projektowany mobile-first.

## Co robi

- Sekcja **„Osiemnaste urodziny to najlepszy możliwy start”** pokazuje na liczbach, ile kosztuje
  odłożenie startu o kilka lat przy identycznym planie wpłat.
- Sekcja **„Zanim wpłacisz pierwszą złotówkę”** tłumaczy prostym językiem, czym jest akcja, czym
  ETF, czym konkretnie ten fundusz i gdzie jest haczyk.
- Wykres wartości portfela z rozbiciem na **Twoje wpłaty** i **zysk z procentu składanego**.
- Przeciąganie palcem po wykresie pokazuje wartość w dowolnym miesiącu.
- Karty punktów kontrolnych dla 10, 20 i 50 lat.
- Przełącznik **„w dzisiejszych pieniądzach”** – dyskontuje inflacją zarówno wartość portfela,
  jak i wpłaty, więc wpłaty + zysk zawsze sumują się do pokazanej kwoty.
- Wszystkie parametry są edytowalne suwakiem albo wpisaniem liczby. Ustawienia zapisują się
  w `localStorage`.

## Domyślne założenia

| Parametr              | Domyślnie | Zakres        |
| --------------------- | --------- | ------------- |
| Kwota na start        | 4 000 zł  | 0 – 500 000   |
| Dopłata co miesiąc    | 500 zł    | 0 – 20 000    |
| Zwrot rocznie         | 7,0%      | −10% – 20%    |
| Inflacja rocznie      | 2,5%      | 0% – 15%      |
| Horyzont na wykresie  | 20 lat    | 1 – 50        |

7% to historyczny średni **realny** (po inflacji) zwrot S&P 500; nominalnie było to ok. 10%.

## Model obliczeń

Kapitalizacja jest miesięczna, a stopa miesięczna wyliczana tak, żeby dwanaście miesięcy
złożyło się dokładnie w zadany zwrot roczny: `m = (1 + r)^(1/12) − 1`. Dopłata trafia
do portfela na koniec każdego miesiąca:

```
saldo(k) = saldo(k−1) × (1 + m) + dopłata
```

Kalkulator **pomija** podatek Belki, prowizje maklerskie, ryzyko kursu USD/PLN i opłatę za
zarządzanie funduszem (TER 0,07%). To narzędzie edukacyjne, nie porada inwestycyjna.

## Uruchomienie lokalnie

Wersja Node jest przypięta w `.nvmrc` (Node 24 LTS):

```bash
nvm use          # instaluje/aktywuje wersję z .nvmrc
npm install
npm run dev
```

Pozostałe skrypty:

```bash
npm run build    # tsc + produkcyjny build do dist/
npm run check    # sanity check matematyki projekcji
npm run lint     # oxlint
npm run preview  # serwuje zbudowane dist/
```

## Deploy na GitHub Pages

Workflow `.github/workflows/deploy.yml` buduje projekt i publikuje `dist/` przy każdym pushu
na `main`. Żeby go włączyć:

1. Wypchnij repozytorium na GitHuba.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Kolejny push na `main` opublikuje stronę.

`vite.config.ts` używa `base: './'`, więc build działa zarówno pod `user.github.io/repo/`,
jak i pod własną domeną – nie trzeba nic zmieniać po zmianie nazwy repozytorium.

## Stos

Vite 8 · React 19 · TypeScript · brak bibliotek do wykresów (własny SVG, ~65 kB gzip całości).
