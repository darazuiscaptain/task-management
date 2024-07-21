const date_format = new Intl.DateTimeFormat();

function DateTime(timestamp:number) {
    return date_format.format(new Date(timestamp));
}

export { DateTime }