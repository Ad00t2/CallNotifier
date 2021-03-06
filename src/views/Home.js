/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";

// nodejs library that concatenates classes
import classNames from "classnames";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";

// @material-ui/icons
import CloudUpload from "@material-ui/icons/CloudUpload";
import CloudDownload from "@material-ui/icons/CloudDownload";
import OpenInBrowser from "@material-ui/icons/OpenInBrowser";

// core components
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import GridContainer from "../components/Grid/GridContainer";
import GridItem from "../components/Grid/GridItem";
import Button from "../components/CustomButtons/Button";
import Badge from "../components/Badge/Badge";
import Card from "../components/Card/Card";
import CardHeader from "../components/Card/CardHeader";
import CardBody from "../components/Card/CardBody";
import Muted from "../components/Typography/Muted";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import CustomInput from "../components/CustomInput/CustomInput";
import ClipLoader from "react-spinners/ClipLoader";

// styles
import pageStyles from "../assets/jss/material-kit-react/views/landingPage";
import typeStyles from "../assets/jss/material-kit-react/components/typographyStyle";

// assets
import { primaryColor, infoColor, successColor, roseColor, warningColor, dangerColor } from "../assets/jss/material-kit-react";

// CallNotifier
import * as SIP from "../sip/SIP";
import * as config from "../config/config";

function LogEntry({ entry, i }) {
  const pageClasses = makeStyles(pageStyles)();
  const reqResIconClasses = makeStyles(theme => ({
    reqResIcon: {
      position: 'absolute',
      left: '92%',
      top: '1.5em'
    }
  }))();

  function isReq(entry) {
    return ('method' in entry.message);
  }

  return (
    <Card
      style={{ width: "35em" }}
      title={`Message: ${JSON.stringify(entry.message)}`}
    >
      <CardBody>
        <InputAdornment className={reqResIconClasses.reqResIcon}>
          { (entry.isSend) ?
            <CloudUpload style={{ color: (entry.isSend ? roseColor : warningColor) }} />
            :
            <CloudDownload style={{ color: (entry.isSend ? roseColor : warningColor) }} />
          }
        </InputAdornment>
        { (isReq(entry)) ?
          <div id="requestInfo">
            <h3 style={{ display: "inline" }}>{i}&emsp;</h3>
            <h3 style={{ color: primaryColor, display: "inline" }}>Request&emsp;</h3>
            <h4 style={{ display: "inline" }}>
                { `${entry.message.headers.expires === 0 ? '(UN)' : ''}${entry.message.method} - #${entry.message.headers.cseq.seq}` }
            </h4>
            <p>
              {`${entry.message.uri}`}
            </p>
          </div>
          :
          <div id="responseInfo">
            <h3 style={{ display: "inline" }}>{i}&emsp;</h3>
            <h3 style={{ color: infoColor, display: "inline" }}>Response&emsp;</h3>
            <h4 style={{ color: (entry.message.status == 200 ? successColor : dangerColor), display: "inline" }}>
              { `${entry.message.status} - "${entry.message.reason}"` }
            </h4>
          </div>
        }
        <div id="commonFooter">
          <p>
            {`${entry.address.protocol.toUpperCase()} / ${entry.address.address}:${entry.address.port}`}
          </p>
          <Muted>
            <small>
              {new Date(entry.time).toString()}
            </small>
            <br />
            <small style={{ color: primaryColor }}>
              Hover for more info
            </small>
          </Muted>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Home({}) {
  const pageClasses = makeStyles(pageStyles)();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [showSipLog, setShowSipLog] = useState(false);
  const [callURL, setCallURL] = useState(config.get('callURL'));
  const [openInBackground, setOpenInBackground] = useState(config.get('openInBackground'));
  const [sipLog, setSipLog] = useState([]);

  useEffect(() => {
    SIP.setSipLogCallback((log) => { setSipLog([ ...log ]); });
    return () => SIP.setSipLogCallback((log) => { });
  }, []);

  function unRegister() {
    setLoading(true);
    SIP.unRegister(res => {
      setLoading(false);
      SIP.clearSipLog();
      SIP.stop();
      history.push('/');
    });
  }

  return (
    <Card
      style={{
        width: "95vw",
        height: "95vh",
        transform: "translate(0%, -1.5%)"
      }}
    >
      <CardBody>
        <div id="topRow" style={{ display: "inline" }}>
          <CustomInput
            style={{ float: "left" }}
            labelText="Call URL (<num> in place of calling number)"
            id="callURL"
            formControlProps={{ fullWidth: true }}
            inputProps={{
              type: "text",
              endAdornment: (
                <InputAdornment position="end">
                  <OpenInBrowser className={pageClasses.inputIconsColor} />
                </InputAdornment>
              ),
              value: callURL,
              onChange: (e) => {
                setCallURL(e.target.value);
                config.set('callURL', e.target.value);
              }
            }}
          />
          <Button size="sm" style={{ float: "right" }} onClick={() => unRegister()} color="primary">Unregister</Button>
          <FormControlLabel
            style={{ float: "left", marginRight: "1.5em" }}
            control={
              <Switch
                checked={openInBackground}
                onChange={(e) => {
                  setOpenInBackground(e.target.checked);
                  config.set('openInBackground', e.target.checked);
                }}
                name="openInBackground"
              />
            }
            label="Open Call Link in Background (restart required)"
          />
          <FormControlLabel
            style={{ float: "left" }}
            control={
              <Switch
                checked={showSipLog}
                onChange={(event) => setShowSipLog(event.target.checked)}
                name="showSipLog"
              />
            }
            label="Show SIP Log"
          />
        </div>
        <div id="loader"
          style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <ClipLoader
            color={primaryColor}
            loading={loading}
            size="5em"
          />
        </div>
        { (!loading) &&
          <div
            style={{
              margin: "5em auto",
              overflow: "auto",
              width: "70vw",
              maxHeight: "72vh"
            }}
          >
            { (showSipLog) ?
              sipLog.map((entry, i) => {
                return (<LogEntry key={entry.id} entry={entry} i={sipLog.length - i} />);
              })
              :
              <h1
                style={{
                  margin: "25vh auto",
                  textAlign: "center",
                  color: "grey"
                }}
              >
                Now listening for inbound calls.
              </h1>
            }
          </div>
        }
      </CardBody>
    </Card>
  );
}
