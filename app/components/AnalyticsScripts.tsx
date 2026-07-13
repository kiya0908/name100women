type AnalyticsScriptsProps = {
  ga4Id: string | null;
  clarityId: string | null;
};

export function AnalyticsScripts({
  ga4Id,
  clarityId,
}: AnalyticsScriptsProps) {
  return (
    <>
      {ga4Id ? (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              ga4Id,
            )}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(
                ga4Id,
              )},{anonymize_ip:true});`,
            }}
          />
        </>
      ) : null}
      {clarityId ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(
              clarityId,
            )});`,
          }}
        />
      ) : null}
    </>
  );
}
