# Brand assets

The Apple, Tesla and NVIDIA monochrome brand marks in public/brands are sourced from Simple Icons (https://simpleicons.org/), repository https://github.com/simple-icons/simple-icons/tree/develop/icons. Brand names and marks belong to their respective owners. These assets remain available locally for first-party views. The public market table uses these local logos for exact ticker matches and LogoAPI.sh for other symbols, followed by Financial Modeling Prep images, the same-origin Alpaca endpoint and initials when an image is unavailable.

JPMorganChase: official website icon from https://www.jpmorganchase.com/etc.clientlibs/cws/clientlibs/clientlib-base/resources/jpmc/images/jpmc-favicon-152.png.
ExxonMobil: official investor relations icon linked at https://investor.exxonmobil.com, hosted at https://d1io3yog0oux5.cloudfront.net/_14a89599fd1b18d59cc379f8fa0633eb/exxonmobil/files/theme/images/favicons/android-chrome-192x192.png.
SPY: issuer State Street's official icon, https://www.ssga.com/favicon.ico.

Both the public landing explorer and the authenticated market table share the Alpaca-backed first-party table and AssetLogo component. See [public-market-explorer.md](public-market-explorer.md).

LogoAPI.sh is used as an external image service, loaded through `next/image` with `unoptimized`; no external scripts are included. The URL requests an exact ticker, a supported exchange prefix when available, a square image and `fallback=404` so a generated provider tile is not presented as an actual logo. Each image tries its local asset (if any), LogoAPI.sh, Financial Modeling Prep and Alpaca once, then settles on initials. While loading, initials remain visible. The component resets the sequence when symbol or exchange changes.

Provider documentation and terms: https://logoapi.sh/docs/logo-by-stock-ticker and https://logoapi.sh/terms. The service currently allows embedding without an API key or attribution; coverage is incomplete and availability/limits may change. No account, paid plan or credentials were added. No symbols are mapped to another company's logo by name similarity. ETF imagery may represent the issuer, as documented by the provider.

The fallback `https://financialmodelingprep.com/image-stock/{symbol}.png` is the public image endpoint documented at https://site.financialmodelingprep.com/developer/docs/company-image-api. It is marked legacy by its provider. This integration does not create an account, add credentials or subscribe to paid financial datasets; it only embeds available logo images. Verified on the exact first catalog page: A (Agilent), AA (Alcoa) and AAA return real PNG images; AAAA and AAAB returned 404 from both external sources and retain initials. Do not treat a passing MSFT test as evidence that the first catalog page has image coverage. Provider coverage and legacy endpoint availability are not guaranteed for the full catalog.

The current FMP image for AAA contains white artwork on transparency. `AssetLogo` gives that exact ticker/source a dark brand surface in both app themes; other sources retain the normal white brand plate. Successful HTTP loading alone does not verify visible artwork: check screenshots and contrast too.
