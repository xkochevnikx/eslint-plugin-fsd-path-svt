'use strict';
const path = require('path');

module.exports = {
    meta: {
        type: null,
        docs: {
            description: 'feature sliced relative path checker',
            recommended: false,
            url: null,
        },
        fixable: null,
        schema: [],
    },

    create(context) {
        return {
            //! принимаем ноду
            ImportDeclaration(node) {
                //! получам путь файла
                const filename = context.getFilename();
                //! и из ноды вытягиваем значение в виде строки адреса импорта
                const importTo = node.source.value;
                //! дальше передаём всё в функцию проверки и если она возвращает тру ругаемся линтером
                if (shouldBeRelative(filename, importTo))
                    context.report(
                        node,
                        'Пути в рамках одного модуля должны быть относительные'
                    );
            },
        };
    },
};

const layers = {
    entities: 'entities',
    features: 'features',
    shared: 'shared',
    pages: 'pages',
    widgets: 'widgets',
};

//! является ли путь относительным функция из коробки по аналогии с includes принимает строку и делает проверку возвращая булеан
function isPathRelative(path) {
    return path === '.' || path.startsWith('./') || path.startsWith('../');
}
//! проверяем этой функцией должен ли быть путь относительным . в рамках одного модуля пути должны быть относительными. в остальных случаях используем абсолютные импорты из паблик апи. Первым аргументом передаём путь к файлу в котором находимся а вторым импорт. ЕСЛИ У НАС СОВПАДАЕТ СЛОЙ И СЛАЙС ТО ИМПОРТ ДОЛЖЕН БЫТЬ ОТНОСИТЕЛЬНЫМ В РАМКАХ ОДНОГО МОДУЛЯ.
function shouldBeRelative(from, to) {
    //! если импорт из source.value начинается на что либо из перечисленного из условия то текущий импорт дальше не проверяем
    if (isPathRelative(to)) {
        return false;
    }
    //! разбиваем импорт по слешу и сохраняем слой и слайс импорта в отдельные переменные
    const toArray = to.split('/');
    const toLayer = toArray[0];
    const toSlice = toArray[1];
    //! если чего то из этого у нас нету, или нету такого слоя то заканчиваем. поскольку нас интересуют только определённые сегменты из наших слоёв. если это импорт из других папок\библиотек мы не проверяем эти импорты и возвращаем фолс
    if (!toLayer || !toSlice || !layers[toLayer]) {
        return false;
    }
    // работа с from
    //! дальше работаем с путём нахождения и преобразовывае путь к единому формату методом потому что на разных операционках пути разные, возвращаются они только с двумя флешами \\ в начале
    const normalizedPath = path.toNamespacedPath(from);
    //! дальше нам нужно всё что идёт после папки src, разбиваем строку на 2 части по разделителю и берём первый элемент это всё что идём от src
    const projectFrom = normalizedPath.split('src')[1];
    //! экранируем слеш
    const fromArray = projectFrom.split('\\');
    //! дальше как и выше только возращаемый массив начинается с пустых кавычек хз почему.
    const fromLayer = fromArray[1];
    const fromSlice = fromArray[2];
    if (!fromLayer || !fromSlice || !layers[fromLayer]) {
        return false;
    }
    //! возвращает функция булеан , если в файле и импорте соврадают и слой и слайс то импорт должен быть относительным
    return fromSlice === toSlice && toLayer === fromLayer;
}
