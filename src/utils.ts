export function zip<T1, T2>(a: T1[], b: T2[]): [T1, T2][] { return a?.map((k, i) => [k, b[i]]) }

export function readTextFileAsync(file: File) : Promise<string> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    })
}

export function download(data: string, filename: string, type: string) {
    var file = new Blob([data], {type});
    if ((<any>window.navigator).msSaveOrOpenBlob) // IE10+
        (<any>window.navigator).msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
        url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

export function selectFile (contentType: string) : Promise<File> {
    return new Promise(resolve => {
        let input = document.createElement('input');
        input.type = 'file';
        input.multiple = false;
        input.accept = contentType;

        input.onchange = _ => {
            let files = Array.from(input.files);
            resolve(files[0]);
        };
        
        input.click();
    });
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(() => resolve(null), ms))
}