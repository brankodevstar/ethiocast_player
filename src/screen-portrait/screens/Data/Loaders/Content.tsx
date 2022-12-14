import GLOBAL from '../../../../datalayer/global';
import DAL from '../../../../datalayer/dal_web';
import UTILS from '../../../../datalayer/utils';
import LANG from '../../../../languages/languages';

class ContentLoader {
    static getContent = async () => {
        try {
            GLOBAL.EducationStores = [];
            GLOBAL.SeriesStores = [];

            const responses = await Promise.all([
                ContentLoader.getContentTags(),
                ContentLoader.getChannelData(),
                ContentLoader.getEpgData(0),
                ContentLoader.getSeriesData(0),
                ContentLoader.getMovieStores(),
                ContentLoader.getEducationData(0),
                ContentLoader.getMusicAlbums(),
                ContentLoader.getHome(),
            ]);

            return {success: true};
        } catch (error) {
            return [];
        }
    };

    static getContentTags = async () => {
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CRM +
            '/' +
            GLOBAL.User.products.productid +
            '_tags.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            if (data != undefined) {
                GLOBAL.Tags = data;
            }
            return {success: true};
        } catch (error) {
            return {success: true};
        }
    };
    static getSupportMenu = async () => {
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CRM +
            '/product_support.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            if (data != undefined) {
                GLOBAL.SupportPages = data;
            }
            return {success: true};
        } catch (error) {
            return {success: true};
        }
    };

    static getChannelData = async () => {
        if (UTILS.checkMenuExists('Channels') == false) {
            return;
        }
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CRM +
            '/' +
            GLOBAL.ProductID +
            '_product_channels_v2.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            GLOBAL.Channels = data.tv;
            GLOBAL.Channels_Selected = data.tv[0].channels;
            GLOBAL.Channels_Selected_Category_ID = data.tv[0].id;
            GLOBAL.Channels_Selected_Category_Index = UTILS.getCategoryIndex(
                GLOBAL.Channels_Selected_Category_ID,
            );
            if (GLOBAL.User.products.ChannelPackages.length > 0) {
                return ContentLoader.getExtraChannelPackage(0);
            } else {
                return {success: true};
            }
        } catch (error) {
            return {success: true};
        }
    };
    static getExtraChannelPackage = async id => {
        if (id < GLOBAL.User.products.ChannelPackages.length) {
            var path =
                GLOBAL.CDN_Prefix +
                '/' +
                GLOBAL.IMS +
                '/jsons/' +
                GLOBAL.CMS +
                '/' +
                GLOBAL.User.products.ChannelPackages[id].PackageID +
                '_package_tv_v2.json';
            try {
                let response = await fetch(path);
                let data = await response.json();
                data = data.tv;
                data.forEach(function (category) {
                    var test = GLOBAL.Channels.find(
                        cat => cat.name == category.name,
                    );
                    if (test == undefined) {
                        GLOBAL.Channels.push(category);
                    } else {
                        var channels = category.channels;
                        channels.forEach(channel => {
                            var test_ = test.channels.find(
                                ch => ch.channel_id == channel.channel_id,
                            );
                            if (test_ == undefined) {
                                test.channels.push(channel);
                            }
                        });
                    }
                });
                return ContentLoader.getExtraChannelPackage(id + 1);
            } catch (error) {
                return {success: true};
            }
        } else {
            return {success: true};
        }
    };
    static getEpgData = async days => {
        if (UTILS.checkMenuExists('Channels') == false) {
            return;
        }
        const date = moment().subtract(days, 'days').format('DD_MM_YYYY');
        const test = moment().subtract(days, 'days').format('YYYY');
        if (test < 2020) {
            return {
                success: false,
                error: LANG.getTranslation('no_access_date_time'),
            };
        } else {
            GLOBAL.EPG = [];
            GLOBAL.EPG_TODAY = [];
            var path =
                GLOBAL.CDN_Prefix +
                '/' +
                GLOBAL.IMS +
                '/jsons/' +
                GLOBAL.CRM +
                '/' +
                date +
                '_' +
                GLOBAL.ProductID +
                '_product_epg_v4.json?t=' +
                new Date().getTime();
            try {
                let response = await fetch(path);
                let data = await response.json();
                GLOBAL.EPG = data.channels;
                GLOBAL.EPG_TODAY = GLOBAL.EPG;
                GLOBAL.EPG_DATE_LOADED = date;
                if (GLOBAL.User.products.ChannelPackages.length > 0) {
                    return ContentLoader.getExtraEpg(0, 0);
                } else {
                    return {success: true};
                }
            } catch (error) {
                return {success: true};
            }
        }
    };
    static getExtraEpg = async (days, id) => {
        if (id < GLOBAL.User.products.ChannelPackages.length) {
            const date = moment().subtract(days, 'days').format('DD_MM_YYYY');
            const test = moment().subtract(days, 'days').format('YYYY');
            if (test < 2019) {
                return {
                    success: false,
                    error: LANG.getTranslation('no_access_date_time'),
                };
            } else {
                var path =
                    GLOBAL.CDN_Prefix +
                    '/' +
                    GLOBAL.IMS +
                    '/jsons/' +
                    GLOBAL.CMS +
                    '/' +
                    date +
                    '_' +
                    GLOBAL.User.products.ChannelPackages[id].PackageID +
                    '_package_epg_v4.json?t=' +
                    new Date().getTime();
                try {
                    let response = await fetch(path);
                    let data = await response.json();
                    data.channels.forEach(function (element) {
                        GLOBAL.EPG = GLOBAL.EPG.concat(element);
                        GLOBAL.EPG_TODAY = GLOBAL.EPG_TODAY.concat(element);
                    });
                    GLOBAL.EPG_DATE_LOADED = date;
                    if (GLOBAL.User.products.ChannelPackages.length > 0) {
                        return ContentLoader.getExtraEpg(0, id + 1);
                    } else {
                        return {success: true};
                    }
                } catch (error) {
                    return {success: true};
                }
            }
        } else {
            return {success: true};
        }
    };
    static getSeriesData = async index => {
        if (UTILS.checkMenuExists('Series') == false) {
            return;
        }
        var stores = GLOBAL.Product.SeriesStores;
        if (stores != undefined && stores.length > 0) {
            if (stores[index] != undefined) {
                return ContentLoader.getSeriesStores(
                    stores[index].PackageID,
                    index,
                    stores.length,
                );
            } else {
                return {success: true};
            }
        } else {
            return {success: true};
        }
    };
    static getSeriesStores = async (storeId, index, maxstores) => {
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CMS +
            '/' +
            storeId +
            '_series_stores_v2.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            if (data.seriestore && data.seriestore.length > 0) {
                data.seriestore.forEach(item => {
                    GLOBAL.SeriesStores.push(item);
                });
            }
            index = index + 1;
            if (index == maxstores) {
                return {success: true};
            } else {
                return ContentLoader.getSeriesData(index);
            }
        } catch (error) {
            return {success: true};
        }
    };
    static getEducationData = async index => {
        if (UTILS.checkMenuExists('Education') == false) {
            return;
        }
        var stores = GLOBAL.Product.EducationPackages;
        if (stores != undefined && stores.length > 0) {
            if (stores[index] != undefined) {
                return ContentLoader.getEducationStores(
                    stores[index].PackageID,
                    index,
                    stores.length,
                );
            } else {
                return {success: true};
            }
        } else {
            return {success: true};
        }
    };
    static getEducationStores = async (storeId, index, maxstores) => {
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CMS +
            '/' +
            storeId +
            '_course_levels_v2.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            if (data.courselevels && data.courselevels.length > 0) {
                data.courselevels.forEach(item => {
                    GLOBAL.EducationStores.push(item);
                });
            }
            index = index + 1;
            if (index == maxstores) {
                return {success: true};
            } else {
                return ContentLoader.getEducationData(index);
            }
        } catch (error) {
            return {success: true};
        }
    };
    static getMovieStores = async () => {
        if (UTILS.checkMenuExists('Movies') == false) {
            return;
        }
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CRM +
            '/' +
            GLOBAL.ProductID +
            '_product_movies_v2.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            if (data != undefined) {
                GLOBAL.MovieStores = data.vodstore;
            }
            GLOBAL.Focus = 'Home';
            return {success: true};
        } catch (error) {
            GLOBAL.Focus = 'Home';
            return {success: true};
        }
    };
    static getMusicAlbums = async () => {
        if (UTILS.checkMenuExists('Music') == false) {
            return;
        }
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CRM +
            '/' +
            GLOBAL.ProductID +
            '_product_albums_v2.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            if (data != undefined) {
                GLOBAL.Album_Categories = data.categories;
                GLOBAL.Albums = data.categories[0].albums;
            }
            return {success: true};
        } catch (error) {
            return {success: true};
        }
    };
    static getHome = async () => {
        GLOBAL.UI_LoadedTZ = Math.round(moment().format('x') / 1000);
        var path =
            GLOBAL.CDN_Prefix +
            '/' +
            GLOBAL.IMS +
            '/jsons/' +
            GLOBAL.CRM +
            '/' +
            GLOBAL.ProductID +
            '_metro_v2.json';
        try {
            let response = await fetch(path);
            let data = await response.json();
            GLOBAL.Metro = data;
            return {success: true};
        } catch (error) {
            return {success: true};
        }
    };
}
const contentLoader = new ContentLoader();
export default ContentLoader;
