import React from "react";
import {
    Button,
    Col,
    ControlLabel,
    FormControl,
    FormGroup,
    Grid,
    HelpBlock,
    Image,
    Row,
    Thumbnail
} from "react-bootstrap";
import CryptoJs from "crypto-js";

import spinner from "./assets/spinner.gif";

export class EncodeForm extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.handleImage = this.handleImage.bind(this);

        this.state = {
            plainText: '',
            imageBytes: [],
            imageBytesAfterEncoding: [],
            encryptionKey: '',
            generatorIdx: 0,
            encryptedMessageLenInBits: 0,
            showSpinner: false,
            progressMsg: ''
        };
    }

    getValidationState() {
        const length = this.state.plainText.length;
        if (length > 10) return 'success';
        else if (length > 5) return 'warning';
        else if (length > 0) return 'error';
        return null;
    }

    handleChange(e) {
        this.setState({plainText: e.target.value});

    }

    onSubmit(e) {
        e.preventDefault();

        const encryptionKey = this.randomKey();
        this.setState(
            {
                showSpinner: true,
                encryptionKey: encryptionKey,
            }
        );

        this.injectCipherText(
            this.encrypt(encryptionKey)
        );

    }

    injectCipherText(encryptedPlaintext) {

        let worker = new Worker(`latest/EncodeWorker.js`);

        worker.postMessage([{
            imageData:this.state.imageBytes,
            encryptedPlaintext
        }]);

        worker.onmessage = (e) => {
            let isUpdateEvent = Object.keys(e.data).indexOf("progressMsg") !== -1;
            if (isUpdateEvent) {
                let progressMsg = e.data.progressMsg.substring(0,150) + "...";
                this.setState({progressMsg})
            } else {
                const {encryptedMessageLenInBits, index, data} = e.data;
                this.setState({
                    generatorIdx: index,
                    encryptedMessageLenInBits: encryptedMessageLenInBits,
                    showSpinner: false,
                    imageBytesAfterEncoding: data
                });
            }

        };
    }

    encrypt(key) {
        let encrypted = CryptoJs.AES.encrypt(this.state.plainText, key).toString();
        console.log(`encrypted: ${encrypted}`);
        return encrypted;
    }


    randomKey() {
        const randomArray = new Uint32Array(26);
        window.crypto.getRandomValues(randomArray);
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        return alphabet.sort((a, b) =>
            randomArray[alphabet.indexOf(a)] - randomArray[alphabet.indexOf(b)]
        ).reduce((a, b) => a + b);


    }

    handleImage(e) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(e.target.files[0]);
        reader.onload = () => {
            const arrayBuffer = reader.result;
            const array = new Uint8Array(arrayBuffer);
            this.setState({imageBytes:  array});
        }
    }

    render() {
        return (
            <div>
                <hr/>
                <form>
                    <FormGroup
                        controlId="formBasicText"
                        validationState={this.getValidationState()}>
                        <ControlLabel>top secret message</ControlLabel>
                        <FormControl
                            type="text"
                            componentClass="textarea"
                            value={this.state.plainText}
                            placeholder="Enter top secret message"
                            onChange={this.handleChange}/>
                        <FormControl.Feedback/>
                        <HelpBlock>Please use proper English.</HelpBlock>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Innocent image </ControlLabel>
                        <FormControl
                            type="file"
                            placeholder="Select innocent image"
                            accept=".bmp"
                            onChange={this.handleImage}/>
                        <FormControl.Feedback/>
                        <HelpBlock>Only .bmp cat images allowed.</HelpBlock>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Encryption Key</ControlLabel>
                        <FormControl
                            readOnly
                            type="text"
                            placeholder=""
                            value={`password:   ${this.state.encryptionKey}\n
                            cyclic group indx:   ${this.state.generatorIdx}
                            message length in bits: ${this.state.encryptedMessageLenInBits}`}/>
                        <FormControl.Feedback/>
                        <HelpBlock>random permutation of [a-z] </HelpBlock>
                    </FormGroup>


                    <Button type="submit" bsStyle="primary" onClick={this.onSubmit}>Encode</Button>
                </form>
                <Image src={spinner} className={`spinner ${this.state.showSpinner ? "spinner" : "hidden"}`}/>
                <p className={`spinner ${this.state.showSpinner ? "" : "hidden"}`}> {this.state.progressMsg} </p>
                <hr/>
                <Grid className="encode-images-grid">
                    <Row>
                        <Col xs={6} md={6}>

                            <Thumbnail id="ItemPreview1" src={`data:image/bmp;base64,${btoa(
                                String.fromCharCode.apply(null,this.state.imageBytes)
                            )}`}
                                       alt="before-encoding" rounded={"true"} responcive={"true"}>
                                <h3>Original Image</h3>
                                <p>the image before injecting the text: {this.state.plainText.substring(0, 10)}</p>
                            </Thumbnail>
                        </Col>
                        <Col xs={6} md={6}>

                            <Thumbnail id="ItemPreview2"
                                       src={`data:image/bmp;base64,${btoa(
                                           String.fromCharCode.apply(null,this.state.imageBytesAfterEncoding)
                                       )}`}
                                       alt="after-encoding" rounded responcive>
                                <h3>Injected Image</h3>
                                <p>Try to notice differences!</p>
                            </Thumbnail>
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }
}