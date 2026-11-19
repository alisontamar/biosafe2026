import { describe, it } from '@serenity-js/playwright-test';
import { Ensure, includes, equals, matches } from '@serenity-js/assertions';
import { Navigate, Page, PageElement, By, Click, Enter, Text } from '@serenity-js/web';

// ---- Elementos de la interfaz (page elements) ----
const titulo = () => PageElement.located(By.css('h1')).describedAs('título principal');
const botonEntrar = () => PageElement.located(By.cssContainingText('button', 'Entrar a BioSafe')).describedAs('botón "Entrar a BioSafe"');
const accesoProfesional = () => PageElement.located(By.cssContainingText('button', 'Profesional de salud')).describedAs('opción "Profesional de salud"');
const campoCorreo = () => PageElement.located(By.css('input[type="email"]')).describedAs('campo de correo');
const campoClave = () => PageElement.located(By.css('input[type="password"]')).describedAs('campo de contraseña');
const botonIngresar = () => PageElement.located(By.cssContainingText('button', 'Ingresar a BioSafe')).describedAs('botón "Ingresar a BioSafe"');
const mensajeError = () => PageElement.located(By.css('.text-red-600')).describedAs('mensaje de error');

describe('BioSafe – Portal web', () => {

  describe('Página de inicio', () => {
    it('muestra el mensaje principal del carnet digital', async ({ actor }) => {
      await actor.attemptsTo(
        Navigate.to('/'),
        Ensure.that(Text.of(titulo()), matches(/El\s+carnet\s+digital/)),
      );
    });

    it('permite abrir el modal de acceso desde el pie de página', async ({ actor }) => {
      await actor.attemptsTo(
        Navigate.to('/'),
        Click.on(botonEntrar()),
        Ensure.that(Text.of(PageElement.located(By.cssContainingText('p', 'Sistema de vigilancia vacunal')).describedAs('subtítulo del modal')), equals('Sistema de vigilancia vacunal')),
      );
    });
  });

  describe('Inicio de sesión de profesionales', () => {
    it('avisa cuando se envían los campos vacíos', async ({ actor }) => {
      await actor.attemptsTo(
        Navigate.to('/'),
        Click.on(botonEntrar()),
        Click.on(accesoProfesional()),
        Click.on(botonIngresar()),
        Ensure.that(Text.of(mensajeError()), includes('Por favor completa todos los campos')),
      );
    });

    it('rechaza credenciales incorrectas', async ({ actor, page }) => {
      await page.route('**/auth/v1/token**', route =>
        route.fulfill({ status: 400, contentType: 'application/json',
          body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }) }));

      await actor.attemptsTo(
        Navigate.to('/'),
        Click.on(botonEntrar()),
        Click.on(accesoProfesional()),
        Enter.theValue('usuario@falso.com').into(campoCorreo()),
        Enter.theValue('clave-incorrecta').into(campoClave()),
        Click.on(botonIngresar()),
        Ensure.that(Text.of(mensajeError()), includes('Credenciales incorrectas')),
      );
    });

    it('lleva al panel de administración con credenciales válidas', async ({ actor, page }) => {
      const pw = page;
      await pw.route('**/auth/v1/token**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          access_token: 'token-e2e', token_type: 'bearer', expires_in: 3600, refresh_token: 'refresh-e2e',
          user: { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated',
                  email: 'doctor@biosafe.bo', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
        }) }));
      await pw.route('**/rest/v1/**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

      await actor.attemptsTo(
        Navigate.to('/'),
        Click.on(botonEntrar()),
        Click.on(accesoProfesional()),
        Enter.theValue('doctor@biosafe.bo').into(campoCorreo()),
        Enter.theValue('clave-correcta').into(campoClave()),
        Click.on(botonIngresar()),
        Ensure.that(Page.current().url().hash, equals('#admin')),
      );
    });
  });
});
