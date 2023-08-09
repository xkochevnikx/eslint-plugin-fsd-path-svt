'use strict';

const path = require(path);

module.exports = {
    meta: {
        type: null,
        docs: {
            description: 'feature sliced relative path checker',
            recommended: false,
            url: null,
        },
        fixable: null,
        //настойки для алиаса, буду принимать из вне строку
        schema: [
            {
                type: 'object',
                properties: {
                    alias: {
                        type: 'string',
                    },
                },
            },
        ],
    },

    create(context) {
        //получаю алиас
        const alias = context.options[0]?.alias || '';
        return {
            //! принимаем ноду
            ImportDeclaration(node) {
                //! получам путь текущего файла
                const filename = context.getFilename();
                //! и из ноды вытягиваем значение в виде строки адреса импорта
                const value = node.source.value;
                //и если в импорте есть алиас беру значение и заменяю его пустой строкой или просто возвращаю исходное значение без измнений
                const importTo = alias ? value.replace(`${alias}/`, '') : value;
                //! дальше передаём всё в функцию проверки и если она возвращает тру ругаемся линтером
                if (shouldBeRelative(filename, importTo))
                    context.report({
                        node,
                        message:
                            'В рамках одного слайса все пути должны быть относительными',
                        fix: (fixer) => {
                            return fixer.replaceText(
                                node.source,
                                `${alias}/${layer}/${slice}`
                            );
                        },
                    });
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

function normalizePath(path) {
    const projectFrom = path.split('src')[1];
    const fromArray = projectFrom.split(/\\|\//);
    return fromArray.join('/');
}

//! базовый хелпер/функция проверки является ли путь относительным. функция из коробки startsWith по аналогии с includes принимает строку и делает проверку возвращая булеан
function isPathRelative(path) {
    return path === '.' || path.startsWith('./') || path.startsWith('../');
}
//! проверяем этой функцией должен ли быть путь относительным . в рамках одного модуля пути должны быть относительными. в остальных случаях используем абсолютные импорты из паблик апи. Первым аргументом передаю путь к файлу в котором находимся а вторым вытянутое значение value из ноды . ЕСЛИ У НАС СОВПАДАЕТ СЛОЙ И СЛАЙС ТО ИМПОРТ ДОЛЖЕН БЫТЬ ОТНОСИТЕЛЬНЫМ В РАМКАХ ОДНОГО МОДУЛЯ.
function shouldBeRelative(from, to) {
    // работа с to
    //! если импорт из source.value начинается на что либо из перечисленного из условия то текущий импорт дальше не проверяем и считаем его абсолютным/
    if (isPathRelative(to)) {
        return false;
    }
    //! разбиваем импорт из сource.value по слешу и сохраняем слой и слайс импорта в отдельные переменные, поскольку импорт начаниается с названия а слоя а затем слайса нас интересует только это.
    const toArray = to.split('/');
    const toLayer = toArray[0];
    const toSlice = toArray[1];
    //! если чего то из этого у нас нету, или объект слоев не содежит такого слоя как в toLayer то возвращаю false и останавливаю процесс с этой нодой. поскольку нас интересуют только определённые сегменты из наших слоёв. если это импорт из других папок\библиотек мы не проверяем эти импорты.
    if (!toLayer || !toSlice || !layers[toLayer]) {
        return false;
    }

    // работа с from
    const fromArray = normalizePath(from).split('/');
    const fromLayer = fromArray[1];
    const fromSlice = fromArray[2];
    if (!fromLayer || !fromSlice || !layers[fromLayer]) {
        return false;
    }
    //! возвращает функция true, если в файле и импорте совпадают и слои и слайсы то импорт должен быть относительным.
    return fromSlice === toSlice && toLayer === fromLayer;
}
