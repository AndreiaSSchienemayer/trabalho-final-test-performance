import faker from 'https://unpkg.com/faker@5.5.3/dist/faker.js';

export function nameFaker() {    
    const firstName = faker.name.firstName();
    const uniqueId = Date.now(); 
    const random = Math.floor(Math.random() * 1000);
    
    return `${firstName}${uniqueId}_${random}`;
}


export function randomNameFavorecido() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `Arthur${timestamp}_${random}`;
}