<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Backend API-only : sans ce hook, Authenticate::redirectTo() tente
        // route('login') dès qu'une requête n'envoie pas "Accept: application/json"
        // (curl, Postman...). Comme aucune route n'est nommée "login", ça lève une
        // RouteNotFoundException *avant* même l'AuthenticationException normale
        // → 500 au lieu de 401, et le hook withExceptions ci-dessous ne l'attrape
        // jamais (mauvais type d'exception). En renvoyant toujours null ici, on
        // force le comportement JSON dans tous les cas.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule): void {
        $schedule->command('rappels:envoyer')->everyMinute();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Backend API-only : sans ce hook, une requête /api/* non authentifiée
        // sans header "Accept: application/json" plante en 500 ("Route [login]
        // not defined") au lieu de renvoyer un 401 JSON propre. Le front
        // (fetch/axios) envoie bien ce header donc ce n'était pas visible en
        // usage normal, mais reste un bug réel (curl, Postman sans header...).
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Non authentifié.'], 401);
            }
        });
    })->create();
