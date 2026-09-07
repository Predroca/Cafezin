let bord = document.getElementById('bttnClick');
const listE = document.querySelectorAll('.list');
const bordPX = bord.getBoundingClientRect().left;
console.log(bordPX)
for(let li of listE){
    li.addEventListener('mouseenter',()=>{
        console.log(li.innerText);
        let liRect = li.getBoundingClientRect();
        let bordRect = bord.getBoundingClientRect();
        let liCenter = liRect.left + liRect.width / 2;
        let bordCenter = bordRect.width / 2;

        let alvoX = liCenter-bordCenter-bordPX;
        bord.style.transform = `translateX(${alvoX}px)`;
    })
}

