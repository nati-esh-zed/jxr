
class Cookie
{
    static set(name, value, exdays, path, domain) 
    {
        // if(value)
        {
            let expires = '';
            if(exdays > 0)
            {
                const d = new Date();
                d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                expires = 'expires=' + d.toUTCString();
            }
            else if(exdays < 0)
            {
                expires = 'expires=Thu, 01 Jan 1970 00:00:01 GMT';
            }
            document.cookie = name + '=' 
                + ((value) ? value : '')
                + ((path) ? ';path='+path:'')
                + ((domain)?';domain='+domain:'')
                + ';' + expires;
        }
    }
    
    static delete(name, path, domain) 
    {
        if(this.get(name)) 
        {
            document.cookie = name + '='
                + ((path) ? ';path='+path:'')
                + ((domain)?';domain='+domain:'')
                + ';expires=Thu, 01 Jan 1970 00:00:01 GMT';
            return true;
        }
        return false;
    }
    
    static get(cname) 
    {
        let name = cname + '=';
        let ca   = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) 
        {
            let c = ca[i]; 
            while(c.charAt(0) == ' ')
            {
                c = c.substring(1);
            } 
            if(c.indexOf(name) == 0)
            {
                return c.substring(name.length, c.length); 
            } 
        } 
        return null; 
    }
};
