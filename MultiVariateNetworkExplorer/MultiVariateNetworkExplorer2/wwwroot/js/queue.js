
class Queue {
    constructor() {
        this.data = {};
        this.head = 0;
        this.tail = 0;
    }

    enqueue(element) {
        this.data[this.tail] = element;
        this.tail++;
    }

    dequeue() {
        const element = this.data[this.head];
        delete this.data[this.head];
        this.head++;
        return element;
    }

    peek() {
        return this.data[this.head];
    }

    get length() {
        return this.tail - this.head;
    }

    get isEmpty(){
        return this.length === 0;
    }
}
