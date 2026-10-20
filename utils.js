(function () {
    'use strict';

    function escapeHtml(valor) {
        return String(valor === null || valor === undefined ? '' : valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatFecha(iso) {
        if (!iso) {
            return '';
        }

        var fecha = new Date(iso);

        if (isNaN(fecha.getTime())) {
            return '';
        }

        function dosDigitos(numero) {
            return ('0' + numero).slice(-2);
        }

        return dosDigitos(fecha.getDate()) + '/' +
            dosDigitos(fecha.getMonth() + 1) + '/' +
            fecha.getFullYear() + ' ' +
            dosDigitos(fecha.getHours()) + ':' +
            dosDigitos(fecha.getMinutes());
    }

    window.GGS_UTILS = {
        escapeHtml: escapeHtml,
        formatFecha: formatFecha
    };
})();
