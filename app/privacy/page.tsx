import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Политика обработки персональных данных и использования cookie для сайта prime performance.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.ru";
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? COMPANY.email;

  return (
    <main className="min-h-screen bg-background text-foreground pt-32 pb-20">
      <div className="container max-w-4xl">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/40 mb-4">
            Документы
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-light tracking-tight">
            Политика в отношении обработки персональных данных
          </h1>
          <p className="mt-4 text-sm text-foreground/50 leading-relaxed">
            Настоящая политика обработки персональных данных составлена в соответствии с требованиями
            Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/70">
          <section>
            <h2 className="text-lg text-foreground mb-3">1. Общие положения</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Настоящая политика обработки персональных данных определяет порядок обработки персональных
                данных и меры по обеспечению безопасности персональных данных, предпринимаемые владельцем
                интернет-магазина {COMPANY.brandName} (далее — Оператор).
              </li>
              <li>
                Оператор ставит своей важнейшей целью соблюдение прав и свобод человека и гражданина при
                обработке его персональных данных, включая защиту прав на неприкосновенность частной жизни,
                личную и семейную тайну.
              </li>
              <li>
                Настоящая Политика применяется ко всей информации, которую Оператор может получить о
                посетителях веб-сайта {siteUrl}.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">2. Основные понятия</h2>
            <p>
              Персональные данные, обработка персональных данных, пользователь, оператор, автоматизированная
              обработка, распространение, уничтожение персональных данных и иные термины используются в
              значениях, определённых Федеральным законом № 152-ФЗ.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">3. Права и обязанности Оператора</h2>
            <p className="mb-2">3.1. Оператор имеет право:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>получать от субъекта персональных данных достоверную информацию;</li>
              <li>продолжать обработку персональных данных без согласия субъекта при наличии законных оснований;</li>
              <li>самостоятельно определять перечень мер по обеспечению безопасности персональных данных.</li>
            </ul>
            <p className="mt-4 mb-2">3.2. Оператор обязан:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>обрабатывать персональные данные в соответствии с законодательством РФ;</li>
              <li>предоставлять субъекту персональных данных информацию об обработке по его запросу;</li>
              <li>принимать необходимые правовые, организационные и технические меры защиты;</li>
              <li>обеспечивать свободный доступ к настоящей Политике.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">4. Права и обязанности субъектов персональных данных</h2>
            <p className="mb-2">Пользователь имеет право:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>получать сведения об обработке своих персональных данных;</li>
              <li>требовать уточнения, блокировки или уничтожения данных;</li>
              <li>отозвать согласие на обработку персональных данных;</li>
              <li>обжаловать действия Оператора в установленном законом порядке.</li>
            </ul>
            <p className="mt-4 mb-2">Пользователь обязан:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>предоставлять достоверные персональные данные;</li>
              <li>своевременно уведомлять Оператора об изменении своих данных.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">5. Принципы обработки персональных данных</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>обработка персональных данных осуществляется на законной и справедливой основе;</li>
              <li>обработка осуществляется только в целях, заявленных при сборе данных;</li>
              <li>обрабатываются данные в объёме, необходимом для достижения указанных целей;</li>
              <li>обеспечивается актуальность и точность данных.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">6. Цели обработки персональных данных</h2>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <div className="grid sm:grid-cols-[1.2fr_1fr] gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/40 pb-3 border-b border-foreground/10">
                <span>Цель обработки</span>
                <span>Персональные данные</span>
              </div>
              <div className="grid sm:grid-cols-[1.2fr_1fr] gap-2 py-3 border-b border-foreground/10">
                <span>Оформление и обработка заказов</span>
                <span>имя, телефон, email</span>
              </div>
              <div className="grid sm:grid-cols-[1.2fr_1fr] gap-2 py-3 border-b border-foreground/10">
                <span>Обратная связь с Пользователем</span>
                <span>имя, телефон</span>
              </div>
              <div className="grid sm:grid-cols-[1.2fr_1fr] gap-2 py-3 border-b border-foreground/10">
                <span>Информирование о статусе заказа</span>
                <span>телефон, email</span>
              </div>
              <div className="grid sm:grid-cols-[1.2fr_1fr] gap-2 pt-3">
                <span>Консультации и поддержка</span>
                <span>имя, телефон</span>
              </div>
            </div>
            <p className="mt-4">
              Правовые основания: договоры купли-продажи, согласие субъекта персональных данных, требования
              законодательства РФ.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">7. Условия обработки персональных данных</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>обработка персональных данных осуществляется с согласия Пользователя;</li>
              <li>
                персональные данные могут обрабатываться без согласия Пользователя в случаях, предусмотренных
                законодательством РФ.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">8. Порядок хранения и защиты персональных данных</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Оператор принимает все необходимые меры для защиты персональных данных от неправомерного доступа.</li>
              <li>
                Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных
                законом; исполнения обязательств по договору (доставка, оплата); согласия Пользователя.
              </li>
              <li>
                Пользователь может отозвать согласие на обработку персональных данных, направив уведомление на
                электронную почту Оператора.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">9. Действия с персональными данными</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>сбор, хранение, использование;</li>
              <li>передача в рамках исполнения договора;</li>
              <li>обезличивание, удаление и уничтожение персональных данных.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">10. Трансграничная передача персональных данных</h2>
            <p>
              Трансграничная передача персональных данных осуществляется только при соблюдении требований
              законодательства РФ.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">11. Cookie и аналитика</h2>
            <p>
              Сайт использует cookie и сервисы аналитики (например, Яндекс.Метрика) для улучшения качества
              сервиса. Пользователь может дать или отозвать согласие на использование cookie через
              интерфейс сайта.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">12. Конфиденциальность</h2>
            <p>
              Оператор и иные лица, имеющие доступ к персональным данным, обязуются не раскрывать их без
              согласия Пользователя, если иное не предусмотрено законом.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">13. Заключительные положения</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Все вопросы, связанные с обработкой персональных данных, можно направлять на электронную
                почту Оператора, указанную на сайте {siteUrl}.
              </li>
              <li>Политика действует бессрочно до замены новой редакцией.</li>
              <li>
                Актуальная версия Политики размещена по адресу:{" "}
                <a
                  href={`${siteUrl}/privacy`}
                  className="text-foreground/70 hover:text-foreground underline underline-offset-4"
                >
                  {siteUrl}/privacy
                </a>
                .
              </li>
            </ol>
            <p className="mt-4">
              Контактный email оператора:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-foreground/70 hover:text-foreground underline underline-offset-4"
              >
                {contactEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg text-foreground mb-3">14. Реквизиты оператора</h2>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <ul className="space-y-2">
                <li>
                  <span className="text-foreground">Оператор:</span> {COMPANY.legalName}
                </li>
                <li>
                  <span className="text-foreground">ИНН:</span> {COMPANY.inn}
                </li>
                <li>
                  <span className="text-foreground">ОГРНИП:</span> {COMPANY.ogrnip}
                </li>
                <li>
                  <span className="text-foreground">Email:</span>{" "}
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-foreground/70 hover:text-foreground underline underline-offset-4"
                  >
                    {COMPANY.email}
                  </a>
                </li>
                <li>
                  <span className="text-foreground">Телефон:</span>{" "}
                  <a
                    href={`tel:${COMPANY.phoneHref}`}
                    className="text-foreground/70 hover:text-foreground underline underline-offset-4"
                  >
                    {COMPANY.phoneDisplay}
                  </a>
                </li>
                <li>
                  <span className="text-foreground">Банк:</span> {COMPANY.bankName}
                </li>
                <li>
                  <span className="text-foreground">БИК:</span> {COMPANY.bik}
                </li>
                <li>
                  <span className="text-foreground">Р/с:</span> {COMPANY.settlementAccount}
                </li>
                <li>
                  <span className="text-foreground">К/с:</span> {COMPANY.correspondentAccount}
                </li>
                <li>
                  <span className="text-foreground">Валюта счета:</span> {COMPANY.currency}
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
