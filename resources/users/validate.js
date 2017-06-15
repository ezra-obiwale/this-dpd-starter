if (this.firstName) {
    this.name = this.firstName;
    if (this.lastName) {
        this.name += ' ' + this.lastName;
    }
}
else if (this.name) {
    var parts = this.name.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[parts.length - 1];
}