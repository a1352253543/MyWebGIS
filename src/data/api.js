import fetch from '../common/js/fetch';

// 请求台风数据
export function getTyphoonData(){
    let url = 'datacache/typhoon.json';
    return fetch({
        method: 'GET',
        url,
    }).then(res=>{
        return res;
    })
}