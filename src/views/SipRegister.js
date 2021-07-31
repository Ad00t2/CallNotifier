/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import Radio from "@material-ui/core/Radio";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

// @material-ui/icons
import Public from "@material-ui/icons/Public";
import Dns from "@material-ui/icons/Dns";
import Person from "@material-ui/icons/Person";
import Lock from "@material-ui/icons/Lock";
import Check from "@material-ui/icons/Check";
import FiberManualRecord from "@material-ui/icons/FiberManualRecord";
import Fingerprint from "@material-ui/icons/Fingerprint";

// components
import GridContainer from "../components/Grid/GridContainer";
import GridItem from "../components/Grid/GridItem";
import Button from "../components/CustomButtons/Button";
import Badge from "../components/Badge/Badge";
import Card from "../components/Card/Card";
import CardBody from "../components/Card/CardBody";
import CardHeader from "../components/Card/CardHeader";
import CardFooter from "../components/Card/CardFooter";
import CustomInput from "../components/CustomInput/CustomInput";
import ClipLoader from "react-spinners/ClipLoader";

// styles
import pageStyles from "../assets/jss/material-kit-react/views/loginPage";
import crsStyles from "../assets/jss/material-kit-react/customCheckboxRadioSwitch";

// assets
import { primaryColor } from "../assets/jss/material-kit-react";
import image from "../assets/img/bg7.jpg";

// CallNotifier
import * as SIP from "../sip/SIP";
import { getRegister, setRegister } from "../config/config";

export default function SipRegister({ isRegistered }) {
  const pageClasses = makeStyles(pageStyles)();
  const crsClasses = makeStyles(crsStyles)();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [regPhase, setRegPhase] = useState(0);

  const [errorMsg, setErrorMsg] = useState(''); const errorMsgLengthCap = 75;
  const [rememberMe, setRememberMe] = useState(true);

  const [domain, setDomain] = useState(getRegister('domain'));
  const [proxy, setProxy] = useState(getRegister('proxy'));
  const [tlsAddress, setTlsAddress] = useState(getRegister('tlsAddress') === '' ? 'arc2.langineers.com' : getRegister('tlsAddress'));
  const [user, setUser] = useState(getRegister('user'));
  const [protocol, setProtocol] = useState(getRegister('protocol'));
  const [password, setPassword] = useState('');

  function raiseError(msg) {
    setErrorMsg(msg);
    SIP.stop();
  }

  function back() {
    SIP.stop();
    setRegPhase(0);
  }

  function toHome(regRes) {
    SIP.setIsRegistered(true);
    setInterval(() => {
      if (!isRegistered) {
        SIP.unRegister(res => {
          SIP.register(null, res => {
            SIP.register(SIP.getUA().auth.password, res => {
              if (res.status >= 200 && res.status < 300) SIP.setIsRegistered(true);
              else if (res.status >= 300) { SIP.stop(); history.push('/'); }
            });
          });
        });
      }
    }, Math.round(((5.0 / 6) * parseInt(regRes.headers.expires)) * 1000));
    history.push('/home');
  }

  function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (regPhase === 0) {
      if (rememberMe) setRegister(domain, proxy, tlsAddress, user, protocol, true);
      else setRegister("", "", "", "", "", true);

      SIP.init(domain, proxy, tlsAddress, user, protocol, () => {
        SIP.register(null, res => {
          if (res) {
            if (res.status === 401 || res.status === 407) setRegPhase(1);
            else if (res.status >= 200 && res.status < 300) toHome(res);
            else if (res.status >= 300) raiseError(`A SIP error has occurred.\nPlease try again.\nResponse:\n${JSON.stringify(res)}`);
            else raiseError(`Unknown response:\n${JSON.stringify(res)}\nPlease try again.`);
          } else {
            raiseError('No response.\nPlease try again.');
          }
          setLoading(false);
        });
      });
    } else if (regPhase === 1) {
      SIP.register(password, res => {
        if (res) {
          if (res.status === 401 || res.status === 407) { setErrorMsg(`Authentication failed.\nPlease try again.\nResponse: ${JSON.stringify(res)}`); back(); }
          else if (res.status >= 200 && res.status < 300) toHome(res);
          else if (res.status >= 300) raiseError(`A SIP error has occurred.\nPlease try again.\nResponse: ${JSON.stringify(res)}`);
          else raiseError(`Unknown response:\n${JSON.stringify(res)}\nPlease try again.`);
        } else {
          raiseError('No response.\nPlease try again.');
        }
        setLoading(false);
      });
    }
  }

  return (
    <div className={pageClasses.container}>
      <GridContainer justify="center">
        <GridItem xs={10} sm={7} style={{ minWidth: "25em" }}>
          <Card style={{ minHeight: "20em" }}>
            <CardHeader className={pageClasses.cardHeader} color="primary">
              <h1>SIP Register</h1>
            </CardHeader>
            <div
              style={{
                position: "absolute", left: "50%", top: "67%",
                transform: "translate(-50%, -67%)"
              }}
            >
              <ClipLoader
                color={primaryColor}
                loading={loading}
                size="5em"
              />
            </div>
            <CardBody>
              { (errorMsg !== '' && !loading) &&
                <CardHeader
                  className={pageClasses.cardHeader}
                  style={{ textAlign: "center", margin: "0.5em" }}
                  color="danger"
                  title={errorMsg}
                >
                  { errorMsg.length <= errorMsgLengthCap ? errorMsg : `${errorMsg.substring(0, errorMsgLengthCap + 1)}...` }
                  <br />
                  { errorMsg.length > errorMsgLengthCap ? 'Hover for more info' : '' }
                </CardHeader>
              }
              <form className={pageClasses.form} style={{ textAlign: "center", margin: "1em 0 0", display: "block" }} onSubmit={onSubmit}>
                { (!loading && regPhase === 0) &&
                  <div id="regInputs">
                    <CustomInput
                      labelText="Domain"
                      id="first"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "text",
                        endAdornment: (
                          <InputAdornment position="end">
                            <Public className={pageClasses.inputIconsColor} />
                          </InputAdornment>
                        ),
                        value: domain,
                        onChange: (e) => setDomain(e.target.value)
                      }}
                    />
                    <CustomInput
                      labelText="Proxy"
                      id="proxy"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "text",
                        endAdornment: (
                          <InputAdornment position="end">
                            <Dns className={pageClasses.inputIconsColor} />
                          </InputAdornment>
                        ),
                        value: proxy,
                        onChange: (e) => setProxy(e.target.value)
                      }}
                    />
                    { (protocol === 'TLS') &&
                      <CustomInput
                        labelText="TLS Address"
                        id="tlsAddress"
                        formControlProps={{ fullWidth: true }}
                        inputProps={{
                          type: "text",
                          endAdornment: (
                            <InputAdornment position="end">
                              <Fingerprint className={pageClasses.inputIconsColor} />
                            </InputAdornment>
                          ),
                          value: tlsAddress,
                          onChange: (e) => setTlsAddress(e.target.value)
                        }}
                      />
                    }
                    <CustomInput
                      labelText="User"
                      id="user"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "text",
                        endAdornment: (
                          <InputAdornment position="end">
                            <Person className={pageClasses.inputIconsColor} />
                          </InputAdornment>
                        ),
                        value: user,
                        onChange: (e) => setUser(e.target.value)
                      }}
                    />
                    <div id="opts" style={{ margin:"2em", display:"inline" }}>
                      <FormControlLabel
                        classes={{ label: crsClasses.label }}
                        id="tcp"
                        label="TCP"
                        control={
                          <Radio
                            checked={ protocol === "TCP" }
                            onChange={ () => setProtocol("TCP") }
                            value="TCP"
                            name="TCP"
                            aria-label="TCP"
                            icon={ <FiberManualRecord className={crsClasses.radioUnchecked} /> }
                            checkedIcon={ <FiberManualRecord className={crsClasses.radioChecked} /> }
                            classes={{ checked: crsClasses.radio }}
                          />
                        }
                      />
                      <FormControlLabel
                        classes={{ label: crsClasses.label }}
                        id="udp"
                        label="UDP"
                        control={
                          <Radio
                            checked={ protocol === "UDP" }
                            onChange={ () => setProtocol("UDP") }
                            value="UDP"
                            name="UDP"
                            aria-label="UDP"
                            icon={ <FiberManualRecord className={crsClasses.radioUnchecked} /> }
                            checkedIcon={ <FiberManualRecord className={crsClasses.radioChecked} /> }
                            classes={{ checked: crsClasses.radio }}
                          />
                        }
                      />
                      <FormControlLabel
                        classes={{ label: crsClasses.label }}
                        id="tls"
                        label="TLS"
                        control={
                          <Radio
                            checked={ protocol === "TLS" }
                            onChange={ () => setProtocol("TLS") }
                            value="TLS"
                            name="TLS"
                            aria-label="TLS"
                            icon={ <FiberManualRecord className={crsClasses.radioUnchecked} /> }
                            checkedIcon={ <FiberManualRecord className={crsClasses.radioChecked} /> }
                            classes={{ checked: crsClasses.radio }}
                          />
                        }
                      />
                    </div>
                    <br />
                    <FormControlLabel
                      classes={{ label: crsClasses.label }}
                      style={{ marginBottom: "0.75em" }}
                      id="rememberMe"
                      label="Remember me"
                      control={
                        <Checkbox
                          checked={ rememberMe }
                          onChange={ (e) => setRememberMe(e.currentTarget.checked) }
                          value={ rememberMe }
                          checkedIcon={ <Check className={crsClasses.checkedIcon} /> }
                          icon={ <Check className={crsClasses.uncheckedIcon} />}
                          classes={ { checked: crsClasses.checked } }
                        />
                      }
                    />
                  </div>
                }
                { (!loading && regPhase === 1) &&
                  <div id="authInputs" style={{ marginBottom: "3em" }}>
                    <CustomInput
                      labelText="Password"
                      id="pass"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "password",
                        endAdornment: (
                          <InputAdornment position="end">
                            <Lock className={pageClasses.inputIconsColor} />
                          </InputAdornment>
                        ),
                        autoComplete: "off",
                        value: password,
                        onChange: (e) => setPassword(e.target.value),
                      }}
                    />
                  </div>
                }
                { (!loading) &&
                  <div id="footer" style={{ display: "inline-block" }}>
                    { (regPhase === 1) &&
                      <Button style={{ marginRight: "0.5em" }} onClick={() => back()}>Back</Button>
                    }
                    <Button style={{ marginRight: "0.5em" }} type="submit" color="primary">Continue</Button>
                  </div>
                }
              </form>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
